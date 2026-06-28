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

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f\u00f8]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function toApiName(ptName: string) {
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
  const src = score.fullTime || score.regularTime || score.extraTime || score.penalties;
  if (!src || src.home === null || src.away === null) return null;
  return { home: src.home, away: src.away };
}

type UpdateResult = {
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
  });

  const { data: pendingMatches, error: fetchErr } = await sb
    .from("copaepica_matches")
    .select("id, team_a, team_b, match_date, round_number")
    .lt("match_date", new Date().toISOString())
    .is("result_a", null)
    .order("match_date");

  if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);
  if (!pendingMatches || pendingMatches.length === 0) {
    return { updated: [], failed: [] };
  }

  const byDate: Record<string, typeof pendingMatches> = {};
  for (const m of pendingMatches) {
    const d = m.match_date.slice(0, 10);
    (byDate[d] ||= []).push(m);
  }

  const dateKeys = Object.keys(byDate).sort();
  const result: UpdateResult = { updated: [], failed: [] };
  const FOOTBALL_API_KEY_FETCH = FOOTBALL_API_KEY;

  for (const dateStr of dateKeys) {
    await new Promise((ok) => setTimeout(ok, 500));

    let apiMatches: any[];
    try {
      const url = `${FOOTBALL_API_BASE}/matches?date=${dateStr}&competitions=${COMPETITION_CODE}`;
      const res = await fetch(url, {
        headers: { "X-Auth-Token": FOOTBALL_API_KEY_FETCH },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`football-data.org ${res.status}: ${body}`);
      }
      const data = await res.json();
      apiMatches = data.matches ?? [];
    } catch (err: any) {
      for (const m of byDate[dateStr]) {
        result.failed.push({ match: `${m.team_a} vs ${m.team_b}`, reason: `API error: ${err.message}` });
      }
      continue;
    }

    for (const ourMatch of byDate[dateStr]) {
      const teamAen = toApiName(ourMatch.team_a);
      const teamBen = toApiName(ourMatch.team_b);

      const apiMatch = apiMatches.find((am: any) => {
        const homeName = am.homeTeam?.name ?? am.homeTeam?.shortName ?? "";
        const awayName = am.awayTeam?.name ?? am.awayTeam?.shortName ?? "";
        return (
          (teamNamesMatch(teamAen, homeName) && teamNamesMatch(teamBen, awayName)) ||
          (teamNamesMatch(teamAen, awayName) && teamNamesMatch(teamBen, homeName))
        );
      });

      if (!apiMatch) {
        result.failed.push({ match: `${ourMatch.team_a} vs ${ourMatch.team_b}`, reason: "Não encontrado na API" });
        continue;
      }

      const score = extractScore(apiMatch);
      if (!score) {
        result.failed.push({ match: `${ourMatch.team_a} vs ${ourMatch.team_b}`, reason: "Jogo sem resultado ainda" });
        continue;
      }

      const homeName = apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName ?? "";
      const awayName = apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName ?? "";
      const isHomeTeamA = teamNamesMatch(teamAen, homeName);
      const isAwayTeamA = !isHomeTeamA && teamNamesMatch(teamAen, awayName);

      if (!isHomeTeamA && !isAwayTeamA) {
        result.failed.push({ match: `${ourMatch.team_a} vs ${ourMatch.team_b}`, reason: "Não foi possível mapear os times" });
        continue;
      }

      const resultA = isHomeTeamA ? score.home : score.away;
      const resultB = isHomeTeamA ? score.away : score.home;

      const { error: updateErr } = await sb
        .from("copaepica_matches")
        .update({ result_a: resultA, result_b: resultB })
        .eq("id", ourMatch.id);

      if (updateErr) {
        result.failed.push({ match: `${ourMatch.team_a} vs ${ourMatch.team_b}`, reason: `DB error: ${updateErr.message}` });
      } else {
        result.updated.push(`${ourMatch.team_a} ${resultA}×${resultB} ${ourMatch.team_b}`);
      }
    }

    if (dateKeys.length > 1) await new Promise((ok) => setTimeout(ok, 6500));
  }

  return result;
}
