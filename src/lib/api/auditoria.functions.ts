import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://yuyflyvtxwhmathuxtrr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eWZseXZ0eHdobWF0aHV4dHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1OTUwMywiZXhwIjoyMDgxMTM1NTAzfQ.TpR6R_59FeRFjaOUTMbNLZOMRY0CSNq62po7FdmGnsg";

function getSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const fetchAuditDataServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const client = getSupabaseClient();

    const [matchesRes, predictionsRes, profilesRes] = await Promise.all([
      client
        .from("copaepica_matches")
        .select("id, team_a, team_b, match_date, round_number, result_a, result_b")
        .gte("match_date", "2026-06-28")
        .not("result_a", "is", null)
        .not("result_b", "is", null)
        .order("match_date", { ascending: true }),
      client
        .from("copaepica_predictions")
        .select("user_id, match_id, predicted_a, predicted_b, created_at, points_earned, is_correct"),
      client
        .from("copaepica_profiles")
        .select("id, display_name"),
    ]);

    if (matchesRes.error) throw matchesRes.error;
    if (predictionsRes.error) throw predictionsRes.error;
    if (profilesRes.error) throw profilesRes.error;

    return {
      matches: matchesRes.data ?? [],
      predictions: predictionsRes.data ?? [],
      profiles: profilesRes.data ?? [],
    };
  });
