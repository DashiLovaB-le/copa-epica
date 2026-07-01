import { createServerFn } from "@tanstack/react-start";

export const fetchAuditDataServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const [matchesRes, predictionsRes, profilesRes] = await Promise.all([
      supabaseAdmin
        .from("copaepica_matches")
        .select(
          "id, team_a, team_b, match_date, round_number, result_a, result_b"
        )
        .gte("match_date", "2026-06-28")
        .not("result_a", "is", null)
        .not("result_b", "is", null)
        .order("match_date", { ascending: true }),
      supabaseAdmin
        .from("copaepica_predictions")
        .select(
          "user_id, match_id, predicted_a, predicted_b, created_at, points_earned, is_correct"
        ),
      supabaseAdmin
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
