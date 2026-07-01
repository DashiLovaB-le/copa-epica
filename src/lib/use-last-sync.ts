import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchLastSync(): Promise<string | null> {
  const { data } = await (supabase as any)
    .from("copaepica_sync_log")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1);

  const rows = data as { synced_at: string }[] | null;
  return rows?.[0]?.synced_at ?? null;
}

export function useLastSync() {
  return useQuery({
    queryKey: ["last-sync"],
    queryFn: fetchLastSync,
    refetchInterval: 30_000,
  });
}
