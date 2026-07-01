import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TEAM_MAP: Record<string, string> = {
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

const REVERSE_TEAM_MAP = Object.fromEntries(
  Object.entries(TEAM_MAP).map(([pt, en]) => [en, pt]),
);

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f\u00f8]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function toPtName(enName: string): string {
  return REVERSE_TEAM_MAP[enName] ?? enName;
}

function toEnName(ptName: string): string {
  return TEAM_MAP[ptName] ?? ptName;
}

function teamNamesMatch(a: string, b: string) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  const m = na.length, n = nb.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = na[i - 1] === nb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n] <= 2;
}

function extractScore(match: any) {
  const score = match.score;
  if (!score) return null;
  // football-data.org v4 pode retornar só fullTime sem regularTime
  // Tenta regularTime primeiro, depois fullTime como fallback
  const src = score.regularTime ?? score.fullTime;
  if (!src || src.home === null || src.away === null) return null;
  return { home: src.home, away: src.away };
}

function matchKey(teamA: string, teamB: string, round: number) {
  return `${teamA}||${teamB}||${round}`;
}

function splitDateRange(dateFrom: string, dateTo: string, maxDays = 10): [string, string][] {
  const chunks: [string, string][] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  let current = new Date(start);
  while (current <= end) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);
    const to = chunkEnd > end ? end : chunkEnd;
    chunks.push([
      current.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10),
    ]);
    current = new Date(to);
    current.setDate(current.getDate() + 1);
  }
  return chunks;
}

type UpdateResult = {
  synced: string[];
  updated: string[];
  backfilled: number;
  failed: { match: string; reason: string }[];
};

export async function updateMatchResults(): Promise<UpdateResult> {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
  const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
  const COMPETITION_CODE = "WC";

  if (!FOOTBALL_API_KEY) {
    throw new Error("Missing required env var: FOOTBALL_API_KEY");
  }

  const sb = supabaseAdmin;

  const result: UpdateResult = { synced: [], updated: [], backfilled: 0, failed: [] };

  // 1. Fetch all matches from API em chunks de ≤10 dias (limitação da API free tier)
  const chunks = splitDateRange("2026-06-28", "2026-07-19", 10);
  let apiMatches: any[] = [];
  try {
    for (const [from, to] of chunks) {
      const url = `${FOOTBALL_API_BASE}/matches?dateFrom=${from}&dateTo=${to}&competitions=${COMPETITION_CODE}`;
      const res = await fetch(url, {
        headers: { "X-Auth-Token": FOOTBALL_API_KEY },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`football-data.org ${res.status} (${from}–${to}): ${body}`);
      }
      const data = await res.json();
      const fetched = data.matches ?? [];
      apiMatches.push(...fetched);
      // Rate limit: free tier permite 10 req/min
      if (chunks.length > 1) await new Promise((r) => setTimeout(r, 7000));
    }
    if (apiMatches.length === 0) {
      result.failed.push({ match: "API", reason: "Nenhuma partida encontrada na API para o período" });
      return result;
    }
  } catch (err: any) {
    throw new Error(`Erro ao buscar dados da API: ${err.message}`);
  }

  // 2. Fetch all existing matches from DB (single query)
  const { data: dbMatches, error: fetchErr } = await sb
    .from("copaepica_matches")
    .select("id, team_a, team_b, round_number, result_a, result_b");

  if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);

  const existingMap = new Map<string, typeof dbMatches[0]>();
  for (const m of dbMatches ?? []) {
    existingMap.set(matchKey(m.team_a, m.team_b, m.round_number), m);
  }

  // 3. Classify each API match
  const toInsert: any[] = [];
  const toUpdate: { id: string; result_a: number; result_b: number; label: string }[] = [];

  for (const apiMatch of apiMatches) {
    const homeEn = apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName ?? "";
    const awayEn = apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName ?? "";
    if (!homeEn || !awayEn) {
      continue; // jogos com times ainda indefinidos (ex: fases futuras)
    }

    const matchDate = apiMatch.utcDate;
    if (matchDate && matchDate < "2026-06-28") continue;

    const teamA = toPtName(homeEn);
    const teamB = toPtName(awayEn);
    const roundNumber = apiMatch.matchday ?? 1;
    const score = extractScore(apiMatch);
    const isFinished = apiMatch.status === "FINISHED";

    const teamAen = toEnName(teamA);
    const isHomeA = teamNamesMatch(teamAen, homeEn);
    const isAwayA = !isHomeA && teamNamesMatch(teamAen, awayEn);

    const key = matchKey(teamA, teamB, roundNumber);
    const existing = existingMap.get(key);

    if (existing) {
      if (isFinished && score && (existing.result_a === null || existing.result_b === null)) {
        toUpdate.push({
          id: existing.id,
          result_a: isHomeA ? score.home : score.away,
          result_b: isHomeA ? score.away : score.home,
          label: `${teamA} ${isHomeA ? score.home : score.away}×${isHomeA ? score.away : score.home} ${teamB}`,
        });
      }
    } else {
      if (!isHomeA && !isAwayA) {
        result.failed.push({ match: `${teamA} vs ${teamB}`, reason: "Não foi possível determinar time casa/fora" });
        continue;
      }
      toInsert.push({
        team_a: teamA,
        team_b: teamB,
        match_date: matchDate,
        round_number: roundNumber,
        result_a: (isFinished && score) ? (isHomeA ? score.home : score.away) : null,
        result_b: (isFinished && score) ? (isHomeA ? score.away : score.home) : null,
      });
      result.synced.push(`${teamA} vs ${teamB}`);
    }
  }

  // 4. Batch insert new matches
  if (toInsert.length > 0) {
    const { error: insertErr } = await sb.from("copaepica_matches").insert(toInsert);
    if (insertErr) {
      for (const m of toInsert) {
        result.failed.push({ match: `${m.team_a} vs ${m.team_b}`, reason: `Insert error: ${insertErr.message}` });
      }
      result.synced = [];
    }
  }

  // 5. Batch update results
  for (const u of toUpdate) {
    const { error: updateErr } = await sb
      .from("copaepica_matches")
      .update({ result_a: u.result_a, result_b: u.result_b })
      .eq("id", u.id);

    if (updateErr) {
      result.failed.push({ match: u.label, reason: `Update error: ${updateErr.message}` });
    } else {
      result.updated.push(u.label);
    }
  }

  // 6. Backfill: pontua palpites que ficaram sem pontuação
  //    (criados APÓS o resultado já estar na partida)
  try {
    const { data: matchesWithResults } = await sb
      .from("copaepica_matches")
      .select("id, team_a, team_b, result_a, result_b")
      .not("result_a", "is", null)
      .not("result_b", "is", null);

    if (matchesWithResults) {
      for (const match of matchesWithResults) {
        const { data: unscored } = await sb
          .from("copaepica_predictions")
          .select("id, predicted_a, predicted_b")
          .eq("match_id", match.id)
          .is("is_correct", null);

        if (unscored && unscored.length > 0) {
          for (const p of unscored) {
            const isCorrect = (p.predicted_a === match.result_a && p.predicted_b === match.result_b);
            await sb
              .from("copaepica_predictions")
              .update({ is_correct: isCorrect, points_earned: isCorrect ? 10 : 0 })
              .eq("id", p.id);
          }
          result.backfilled += unscored.length;
        }
      }
    }
  } catch (err: any) {
    console.error("[backfill] Erro no backfill de palpites:", err.message);
  }

  return result;
}
