#!/usr/bin/env node

/**
 * sync-all.mjs — Sincroniza tudo: partidas, resultados e palpites.
 *
 * Uso:
 *   node scripts/sync-all.mjs
 *
 ├─ 1. Busca partidas da football-data.org (últimos 7 dias → +3 dias)
 ├─ 2. Atualiza resultados no banco (novas partidas também são inseridas)
 ├─ 3. Pontua palpites que ficaram sem pontuação (backfill)
 └─ 4. Mostra resumo completo
 */

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

// ── Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC";

const MISSING = [];
if (!SUPABASE_URL) MISSING.push("SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) MISSING.push("SUPABASE_SERVICE_ROLE_KEY");
if (!FOOTBALL_API_KEY) MISSING.push("FOOTBALL_API_KEY");
if (MISSING.length) {
  console.error(`[sync-all] Variáveis ausentes: ${MISSING.join(", ")}`);
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
});

// ── Team name mapping (Português → Inglês / football-data.org) ──────
const TEAM_MAP = {
  "México": "Mexico",
  "África do Sul": "South Africa",
  "Coreia do Sul": "South Korea",
  "República Tcheca": "Czechia",
  "Canadá": "Canada",
  "Bósnia e Herzegovina": "Bosnia-Herzegovina",
  "Catar": "Qatar",
  "Suíça": "Switzerland",
  "Brasil": "Brazil",
  "Marrocos": "Morocco",
  "Haiti": "Haiti",
  "Escócia": "Scotland",
  "Estados Unidos": "United States",
  "Paraguai": "Paraguay",
  "Austrália": "Australia",
  "Turquia": "Turkey",
  "Alemanha": "Germany",
  "Curaçao": "Curaçao",
  "Costa do Marfim": "Ivory Coast",
  "Equador": "Ecuador",
  "Holanda": "Netherlands",
  "Japão": "Japan",
  "Suécia": "Sweden",
  "Tunísia": "Tunisia",
  "Bélgica": "Belgium",
  "Egito": "Egypt",
  "Irã": "Iran",
  "Nova Zelândia": "New Zealand",
  "Espanha": "Spain",
  "Cabo Verde": "Cape Verde Islands",
  "Arábia Saudita": "Saudi Arabia",
  "Uruguai": "Uruguay",
  "França": "France",
  "Senegal": "Senegal",
  "Iraque": "Iraq",
  "Noruega": "Norway",
  "Argentina": "Argentina",
  "Argélia": "Algeria",
  "Áustria": "Austria",
  "Jordânia": "Jordan",
  "Portugal": "Portugal",
  "RD Congo": "Congo DR",
  "Uzbequistão": "Uzbekistan",
  "Colômbia": "Colombia",
  "Inglaterra": "England",
  "Croácia": "Croatia",
  "Gana": "Ghana",
  "Panamá": "Panama",
};

// ── Helpers ──────────────────────────────────────────────────────────
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f\u00f8]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function teamNamesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  const m = na.length, n = nb.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = na[i - 1] === nb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n] <= 2;
}

function toApiName(ptName) {
  return TEAM_MAP[ptName] ?? ptName;
}

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

function extractScore(match) {
  const score = match.score;
  if (!score) return null;
  const src = score.regularTime ?? score.fullTime;
  if (!src || src.home === null || src.away === null) return null;
  return { home: src.home, away: src.away };
}

function statusEmoji(status) {
  switch (status) {
    case "FINISHED": return "🏁";
    case "IN_PLAY": return "🔴";
    case "PAUSED": return "⏸";
    case "TIMED": return "⏳";
    default: return "❓";
  }
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

// ── Etapa 1: Buscar partidas da API ──────────────────────────────
async function fetchAllApiMatches(dates) {
  const all = [];
  for (const d of dates) {
    await sleep(500);
    const url = `${FOOTBALL_API_BASE}/matches?date=${d}&competitions=${COMPETITION_CODE}`;
    process.stdout.write(`  📡 ${d}... `);
    try {
      const res = await fetch(url, {
        headers: { "X-Auth-Token": FOOTBALL_API_KEY },
      });
      if (!res.ok) {
        const body = await res.text();
        console.log(`ERRO ${res.status}: ${body.slice(0, 80)}`);
        continue;
      }
      const data = await res.json();
      const matches = data.matches ?? [];
      console.log(`${matches.length} partida(s)`);
      all.push(...matches);
    } catch (err) {
      console.log(`falha: ${err.message}`);
    }
  }
  return all;
}

// ── Etapa 2: Sincronizar com o banco ─────────────────────────────
async function syncMatches(apiMatches) {
  console.log("\n┌── Etapa 2: Sincronizando resultados ──┐\n");

  // Carrega TODAS as partidas do banco (incluindo as inseridas nesta execução)
  async function loadDbMatches() {
    const { data, error } = await sb
      .from("copaepica_matches")
      .select("*");
    if (error) throw error;
    return data;
  }

  let dbMatches = await loadDbMatches();

  const details = [];
  const seen = new Set(); // evita processar mesma partida 2x na mesma execução
  let updated = 0, inserted = 0, failed = 0;

  for (const apiMatch of apiMatches) {
    const status = apiMatch.status;
    const homeName = apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName ?? "?";
    const awayName = apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName ?? "?";
    const score = extractScore(apiMatch);
    const round = apiMatch.matchday ?? 1;
    const matchId = apiMatch.id; // football-data.org ID

    // Evita duplicatas da mesma partida vinda em dias diferentes
    const dedupKey = `${homeName}||${awayName}||${round}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    // Busca match no banco (última carga)
    let matchedDb = dbMatches.find(dbm => {
      const dbHomeEn = toApiName(dbm.team_a);
      const dbAwayEn = toApiName(dbm.team_b);
      const sameTeams =
        (teamNamesMatch(dbHomeEn, homeName) && teamNamesMatch(dbAwayEn, awayName)) ||
        (teamNamesMatch(dbHomeEn, awayName) && teamNamesMatch(dbAwayEn, homeName));
      return sameTeams && dbm.round_number === round;
    });

    if (!matchedDb) {
      // Partida nova — insere se tiver resultado
      if (status === "TIMED" || status === "SCHEDULED") {
        details.push({ teams: `${homeName} vs ${awayName}`, action: "⏳ futura (ignorada)" });
        continue;
      }
      // Mapeia nomes invertendo o TEAM_MAP
      let teamA = homeName, teamB = awayName;
      for (const [pt, en] of Object.entries(TEAM_MAP)) {
        if (en.toLowerCase() === homeName.toLowerCase()) teamA = pt;
        if (en.toLowerCase() === awayName.toLowerCase()) teamB = pt;
      }

      const matchDate = apiMatch.utcDate ? new Date(apiMatch.utcDate).toISOString() : new Date().toISOString();

      const { data: insertedMatch, error: insertErr } = await sb
        .from("copaepica_matches")
        .insert({
          team_a: teamA,
          team_b: teamB,
          match_date: matchDate,
          round_number: round,
          result_a: score?.home ?? null,
          result_b: score?.away ?? null,
        })
        .select()
        .single();

      if (insertErr) {
        details.push({ teams: `${teamA} vs ${teamB}`, action: `❌ erro ao inserir: ${insertErr.message}` });
        failed++;
      } else {
        const resultStr = score ? `${score.home}×${score.away}` : "sem placar";
        details.push({ teams: `${teamA} vs ${teamB}`, action: `✅ nova (${resultStr})` });
        inserted++;
        // Adiciona ao cache local para não reprocessar
        if (insertedMatch) dbMatches.push(insertedMatch);
      }
      continue;
    }

    // Partida já existe no banco
    if (!score) {
      if (status === "FINISHED") {
        details.push({ teams: `${homeName} vs ${awayName}`, action: `⚠️ FINISHED mas sem score no JSON` });
        failed++;
      } else {
        details.push({ teams: `${homeName} vs ${awayName}`, action: `${statusEmoji(status)} ${status} (sem placar ainda)` });
      }
      continue;
    }

    // Verifica se o resultado já é o mesmo
    if (matchedDb.result_a === score.home && matchedDb.result_b === score.away) {
      details.push({ teams: `${homeName} vs ${awayName}`, action: `✓ já atualizado (${score.home}×${score.away})` });
      continue;
    }

    // Determina qual lado é team_a
    const dbHomeEn = toApiName(matchedDb.team_a);
    const isHomeTeamA = teamNamesMatch(dbHomeEn, homeName);
    const isAwayTeamA = !isHomeTeamA && teamNamesMatch(dbHomeEn, awayName);

    if (!isHomeTeamA && !isAwayTeamA) {
      details.push({ teams: `${matchedDb.team_a} vs ${matchedDb.team_b}`, action: `❌ não foi possível mapear os times` });
      failed++;
      continue;
    }

    const resultA = isHomeTeamA ? score.home : score.away;
    const resultB = isHomeTeamA ? score.away : score.home;

    const { error: updateErr } = await sb
      .from("copaepica_matches")
      .update({ result_a: resultA, result_b: resultB })
      .eq("id", matchedDb.id);

    if (updateErr) {
      details.push({ teams: `${matchedDb.team_a} vs ${matchedDb.team_b}`, action: `❌ erro no DB: ${updateErr.message}` });
      failed++;
    } else {
      details.push({ teams: `${matchedDb.team_a} vs ${matchedDb.team_b}`, action: `✅ ${resultA}×${resultB} (trigger → palpites pontuados)` });
      updated++;
    }
  }

  return { updated, inserted, failed, details };
}

// ── Etapa 3: Backfill de palpites não pontuados ──────────────────
async function backfillPredictions() {
  console.log("\n┌── Etapa 3: Backfill de palpites ──┐\n");

  const { data: matches, error: me } = await sb
    .from("copaepica_matches")
    .select("id, team_a, team_b, result_a, result_b")
    .not("result_a", "is", null)
    .not("result_b", "is", null);

  if (me) {
    console.error("  ❌ Erro ao carregar partidas:", me.message);
    return 0;
  }

  let totalScored = 0;
  for (const match of matches) {
    const { data: predictions, error: pe } = await sb
      .from("copaepica_predictions")
      .select("id, predicted_a, predicted_b")
      .eq("match_id", match.id)
      .is("is_correct", null);

    if (pe) {
      console.error(`  ❌ Erro ao buscar palpites da partida ${match.id}: ${pe.message}`);
      continue;
    }
    if (!predictions || predictions.length === 0) continue;

    let scored = 0;
    for (const p of predictions) {
      const isCorrect = (p.predicted_a === match.result_a && p.predicted_b === match.result_b);
      const { error: ue } = await sb
        .from("copaepica_predictions")
        .update({ is_correct: isCorrect, points_earned: isCorrect ? 10 : 0 })
        .eq("id", p.id);

      if (!ue) scored++;
    }
    if (scored > 0) {
      console.log(`  ${match.team_a} ${match.result_a}×${match.result_b} ${match.team_b}: ${scored} palpites pontuados`);
      totalScored += scored;
    }
  }

  return totalScored;
}

// ── Resumo final ─────────────────────────────────────────────────
function printSummary(results, backfilled) {
  console.log("\n═══════════════════════════════════════");
  console.log("         RESUMO DA SINCRONIZAÇÃO        ");
  console.log("═══════════════════════════════════════\n");

  console.log(`  Partidas atualizadas:   ${results.updated}`);
  console.log(`  Partidas novas:         ${results.inserted}`);
  console.log(`  Falhas:                 ${results.failed}`);
  console.log(`  Palpites pontuados:     ${backfilled}`);
  console.log();

  if (results.details.length > 0) {
    console.log("  Detalhamento:");
    for (const d of results.details) {
      console.log(`    ${d.action} — ${d.teams}`);
    }
  }

  console.log("\n  📌 Dica: O ranking é atualizado automaticamente");
  console.log("     pelos gatilhos do banco de dados.\n");
  console.log("═══════════════════════════════════════\n");
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("  ╔══════════════════════════════════════╗");
  console.log("  ║      SYNC-ALL — Copa Epica 2026       ║");
  console.log("  ╚══════════════════════════════════════╝\n");

  // Gera lista de datas: últimos 7 dias → hoje + 3 dias
  const today = new Date();
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(dateStr(d));
  }
  console.log(`📅 Período: ${dates[0]} → ${dates[dates.length - 1]}`);

  // ── Etapa 1: Fetch ──
  console.log("\n┌── Etapa 1: Buscando partidas da API ──┐\n");
  const apiMatches = await fetchAllApiMatches(dates);
  console.log(`\n  Total de partidas retornadas: ${apiMatches.length}`);

  // ── Etapa 2: Sync ──
  const results = await syncMatches(apiMatches);

  // ── Etapa 3: Backfill ──
  const backfilled = await backfillPredictions();

  // ── Resumo ──
  printSummary(results, backfilled);
}

main().catch((err) => {
  console.error("\n❌ Erro fatal:", err);
  process.exit(1);
});
