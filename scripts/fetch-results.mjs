import { createClient } from "@supabase/supabase-js";

// Load .env file
process.loadEnvFile(".env");

// ── Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC"; // FIFA World Cup

const MISSING = [];
if (!SUPABASE_URL) MISSING.push("SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) MISSING.push("SUPABASE_SERVICE_ROLE_KEY");
if (!FOOTBALL_API_KEY) MISSING.push("FOOTBALL_API_KEY");
if (MISSING.length) {
  console.error(`[fetch-results] Missing env vars: ${MISSING.join(", ")}`);
  process.exit(1);
}

// ── Supabase client ─────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
});

// ── Team name mapping (Portuguese → English / football-data.org) ────
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

/**
 * Normalize a team name (lowercase, strip accents/special chars).
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f\u00f8]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/**
 * Check if two team names match. Tries exact match first (after
 * normalising), then Levenshtein (tolerance 2).
 */
function teamNamesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  // simple Levenshtein
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

/**
 * Convert a team name stored in the DB (Portuguese) to the English
 * name used by football-data.org. Falls back to the Portuguese name
 * as-is when no mapping exists.
 */
function toApiName(ptName) {
  return TEAM_MAP[ptName] ?? ptName;
}

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

// ── Football API ────────────────────────────────────────────────────
async function fetchApiMatches(dateStr) {
  // dateStr: "2026-06-11"
  const url = `${FOOTBALL_API_BASE}/matches?date=${dateStr}&competitions=${COMPETITION_CODE}`;
  console.log(`[fetch-results] GET ${url}`);

  const res = await fetch(url, {
    headers: { "X-Auth-Token": FOOTBALL_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.matches ?? [];
}

function extractScore(match) {
  const score = match.score;
  if (!score) return null;
  // football-data.org v4 pode retornar só fullTime sem regularTime
  // Tenta regularTime primeiro (90min), depois fullTime como fallback
  const src = score.regularTime ?? score.fullTime;
  if (!src || src.home === null || src.away === null) return null;
  return { home: src.home, away: src.away };
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[fetch-results] Starting...");

  // 1. Find matches that are past their start time and have no result yet
  const { data: pendingMatches, error: fetchErr } = await sb
    .from("copaepica_matches")
    .select("id, team_a, team_b, match_date, round_number")
    .lt("match_date", new Date().toISOString())
    .is("result_a", null)
    .order("match_date");

  if (fetchErr) {
    console.error("[fetch-results] Error fetching pending matches:", fetchErr);
    process.exit(1);
  }

  if (!pendingMatches || pendingMatches.length === 0) {
    console.log("[fetch-results] No pending matches to update. Exiting.");
    return;
  }

  console.log(`[fetch-results] Found ${pendingMatches.length} pending match(es):`);
  for (const m of pendingMatches) {
    const d = new Date(m.match_date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`  - ${m.team_a} vs ${m.team_b} (${d})`);
  }

  // 2. Group by date (API accepts one date per call)
  const byDate = {};
  for (const m of pendingMatches) {
    const d = m.match_date.slice(0, 10); // "2026-06-11"
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(m);
  }

  const dateKeys = Object.keys(byDate).sort();
  console.log(`[fetch-results] Querying ${dateKeys.length} unique date(s)...`);

  let updated = 0;
  let failed = 0;

  for (const dateStr of dateKeys) {
    await sleep(500); // rate limit: ~2 calls/sec (free tier allows 10/min)

    let apiMatches;
    try {
      apiMatches = await fetchApiMatches(dateStr);
    } catch (err) {
      console.error(`[fetch-results] API error for ${dateStr}:`, err.message);
      failed += byDate[dateStr].length;
      continue;
    }

    console.log(`[fetch-results] API returned ${apiMatches.length} matches for ${dateStr}`);

    for (const ourMatch of byDate[dateStr]) {
      // Convert our team names to English for API matching
      const teamAen = toApiName(ourMatch.team_a);
      const teamBen = toApiName(ourMatch.team_b);

      // Try to find a matching API match by team names
      const apiMatch = apiMatches.find((am) => {
        const homeName = am.homeTeam?.name ?? am.homeTeam?.shortName ?? "";
        const awayName = am.awayTeam?.name ?? am.awayTeam?.shortName ?? "";
        return (
          (teamNamesMatch(teamAen, homeName) && teamNamesMatch(teamBen, awayName)) ||
          (teamNamesMatch(teamAen, awayName) && teamNamesMatch(teamBen, homeName))
        );
      });

      if (!apiMatch) {
        console.log(`  ✗ ${ourMatch.team_a} (${teamAen}) vs ${ourMatch.team_b} (${teamBen}) → no match found in API`);
        failed++;
        continue;
      }

      const score = extractScore(apiMatch);
      if (!score) {
        console.log(`  ∼ ${ourMatch.team_a} vs ${ourMatch.team_b} → match found but no score yet`);
        failed++;
        continue;
      }

      // Determine which side is team_a and team_b
      const homeName = apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName ?? "";
      const awayName = apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName ?? "";
      const isHomeTeamA = teamNamesMatch(teamAen, homeName);
      const isAwayTeamA = !isHomeTeamA && teamNamesMatch(teamAen, awayName);

      if (!isHomeTeamA && !isAwayTeamA) {
        console.log(`  ✗ ${ourMatch.team_a} vs ${ourMatch.team_b} → could not map sides (API: ${homeName} vs ${awayName})`);
        failed++;
        continue;
      }

      const resultA = isHomeTeamA ? score.home : score.away;
      const resultB = isHomeTeamA ? score.away : score.home;

      // 3. Update the match result (trigger auto-scores predictions)
      const { error: updateErr } = await sb
        .from("copaepica_matches")
        .update({ result_a: resultA, result_b: resultB })
        .eq("id", ourMatch.id);

      if (updateErr) {
        console.error(`  ✗ ${ourMatch.team_a} ${resultA}×${resultB} ${ourMatch.team_b} → DB update failed:`, updateErr.message);
        failed++;
      } else {
        console.log(`  ✓ ${ourMatch.team_a} ${resultA}×${resultB} ${ourMatch.team_b}`);
        updated++;
      }
    }

    // Rate limit: max 10 req/min for free tier, wait a bit between dates
    if (dateKeys.length > 1) await sleep(6500);
  }

  console.log(`[fetch-results] Done. Updated: ${updated}, Failed/skipped: ${failed}`);
}

main().catch((err) => {
  console.error("[fetch-results] Unhandled error:", err);
  process.exit(1);
});
