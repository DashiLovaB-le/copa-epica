import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MatchCard } from "@/components/MatchCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/palpites")({
  head: () => ({ meta: [{ title: "Palpites — Copa Épica" }] }),
  component: PalpitesPage,
});

type MatchRow = {
  id: string;
  team_a: string;
  team_b: string;
  match_date: string;
  result_a: number | null;
  result_b: number | null;
  round_number: number;
};

type PredictionRow = {
  match_id: string;
  predicted_a: number;
  predicted_b: number;
};

async function fetchData(userId: string) {
  const [matches, preds] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .is("result_a", null)
      .order("match_date", { ascending: true }),
    supabase.from("predictions").select("match_id,predicted_a,predicted_b").eq("user_id", userId),
  ]);
  if (matches.error) throw matches.error;
  if (preds.error) throw preds.error;
  return {
    matches: (matches.data ?? []) as MatchRow[],
    preds: (preds.data ?? []) as PredictionRow[],
  };
}

function PalpitesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["palpites", user.id],
    queryFn: () => fetchData(user.id),
  });

  useEffect(() => {
    const ch = supabase
      .channel("palpites-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => qc.invalidateQueries({ queryKey: ["palpites"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  async function savePrediction(matchId: string, a: number, b: number) {
    const { error } = await supabase
      .from("predictions")
      .upsert(
        { user_id: user.id, match_id: matchId, predicted_a: a, predicted_b: b },
        { onConflict: "user_id,match_id" },
      );
    if (error) {
      toast.error(error.message);
      throw error;
    }
    qc.invalidateQueries({ queryKey: ["palpites"] });
  }

  return (
    <div>
      <PageHeader title="Palpites" subtitle="Cravar placar é arte" />
      <div className="p-4 space-y-4">
        {isLoading && <p className="text-center font-bold uppercase">Carregando...</p>}
        {!isLoading && data?.matches.length === 0 && (
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Sem jogos no momento</p>
            <p className="text-sm mt-2 uppercase font-bold tracking-wider text-black/60">
              Volte em breve para palpitar
            </p>
          </div>
        )}
        {data?.matches.map((m) => {
          const p = data.preds.find((x) => x.match_id === m.id);
          const locked = new Date(m.match_date).getTime() <= Date.now();
          return (
            <MatchCard
              key={m.id}
              matchId={m.id}
              teamA={m.team_a}
              teamB={m.team_b}
              matchDate={m.match_date}
              initialPredA={p?.predicted_a}
              initialPredB={p?.predicted_b}
              locked={locked}
              onSave={(a, b) => savePrediction(m.id, a, b)}
            />
          );
        })}
      </div>
    </div>
  );
}
