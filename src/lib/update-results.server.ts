import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
  "Cabo Verde": "Cape Verde",
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
  "RD Congo": "DR Congo",
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
  const src = score.fullTime || score.regularTime || score.extraTime || score.penalties;
  if (!src || src.home === null || src.away === null) return null;
  return { home: src.home, away: src.away };
}

function toPtName(enName: string): string {
  return REVERSE_TEAM_MAP[enName] ?? enName;
}

type UpdateResult = {
  synced: string[];
  updated: string[];
  failed: { match: string; reason: string }[];
};

export async function updateMatchResults(): Promise<UpdateResult> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
  const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
  const COMPETITION_CODE = "WC";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !FOOTBALL_API_KEY) {
    throw new Error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FOOTBALL_API_KEY");
  }

  const sb = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: fetch.bind(globalThis) },
  });

  const result: UpdateResult = { synced: [], updated: [], failed: [] };

  let apiMatches: any[];
  try {
    const url = `${FOOTBALL_API_BASE}/competitions/${COMPETITION_CODE}/matches`;
    const res = await fetch(url, {
      headers: { "X-Auth-Token": FOOTBALL_API_KEY },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`football-data.org ${res.status}: ${body}`);
    }
    const data = await res.json();
    apiMatches = data.matches ?? [];
  } catch (err: any) {
    throw new Error(`API error: ${err.message}`);
  }

  for (const apiMatch of apiMatches) {
    const homeEn = apiMatch.homeTeam?.name ?? "";
    const awayEn = apiMatch.awayTeam?.name ?? "";
    if (!homeEn || !awayEn) {
      result.failed.push({ match: `${homeEn} vs ${awayEn}`, reason: "Time vazio na API" });
      continue;
    }

    const teamA = toPtName(homeEn);
    const teamB = toPtName(awayEn);
    const matchDate = apiMatch.utcDate;
    const roundNumber = apiMatch.matchday ?? 1;
    const score = extractScore(apiMatch);
    const isFinished = apiMatch.status === "FINISHED";

    const { data: existing } = await sb
      .from("copaepica_matches")
      .select("id, result_a, result_b")
      .eq("team_a", teamA)
      .eq("team_b", teamB)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (existing) {
      if (isFinished && score && (existing.result_a === null || existing.result_b === null)) {
        const homeName = apiMatch.homeTeam?.name ?? "";
        const awayName = apiMatch.awayTeam?.name ?? "";
        const isHomeA = teamNamesMatch(normalizeName(teamA), normalizeName(homeName));
        const resultA = isHomeA ? score.home : score.away;
        const resultB = isHomeA ? score.away : score.home;

        const { error: updateErr } = await sb
          .from("copaepica_matches")
          .update({ result_a: resultA, result_b: resultB })
          .eq("id", existing.id);

        if (updateErr) {
          result.failed.push({ match: `${teamA} vs ${teamB}`, reason: `DB error: ${updateErr.message}` });
        } else {
          result.updated.push(`${teamA} ${resultA}×${resultB} ${teamB}`);
        }
      }
    } else {
      const { error: insertErr } = await sb
        .from("copaepica_matches")
        .insert({
          team_a: teamA,
          team_b: teamB,
          match_date: matchDate,
          round_number: roundNumber,
          result_a: (isFinished && score) ? (teamNamesMatch(normalizeName(teamA), normalizeName(apiMatch.homeTeam?.name ?? "")) ? score.home : score.away) : null,
          result_b: (isFinished && score) ? (teamNamesMatch(normalizeName(teamA), normalizeName(apiMatch.homeTeam?.name ?? "")) ? score.away : score.home) : null,
        });

      if (insertErr) {
        result.failed.push({ match: `${teamA} vs ${teamB}`, reason: `DB insert error: ${insertErr.message}` });
      } else {
        result.synced.push(`${teamA} vs ${teamB}`);
      }
    }
  }

  return result;
}
