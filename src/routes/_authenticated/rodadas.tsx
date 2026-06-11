import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ResultCard } from "@/components/ResultCard";

export const Route = createFileRoute("/_authenticated/rodadas")({
  head: () => ({ meta: [{ title: "Rodadas — Copa Épica" }] }),
  component: RodadasPage,
});

type MatchRow = {
  id: string;
  round_number: number;
  team_a: string;
  team_b: string;
  match_date: string;
  result_a: number;
  result_b: number;
};

type Pred = {
  match_id: string;
  predicted_a: number;
  predicted_b: number;
  points_earned: number | null;
};

async function fetchRounds(userId: string) {
  const [m, p] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .not("result_a", "is", null)
      .not("result_b", "is", null)
      .order("round_number", { ascending: false })
      .order("match_date", { ascending: false }),
    supabase
      .from("predictions")
      .select("match_id,predicted_a,predicted_b,points_earned")
      .eq("user_id", userId),
  ]);
  if (m.error) throw m.error;
  if (p.error) throw p.error;
  return { matches: (m.data ?? []) as MatchRow[], preds: (p.data ?? []) as Pred[] };
}

function RodadasPage() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["rodadas", user.id],
    queryFn: () => fetchRounds(user.id),
  });

  const grouped = (data?.matches ?? []).reduce<Record<number, MatchRow[]>>((acc, m) => {
    (acc[m.round_number] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Rodadas" subtitle="Resultados e pontuação" />
      <div className="p-4 space-y-6">
        {isLoading && <p className="text-center font-bold uppercase">Carregando...</p>}
        {!isLoading && data?.matches.length === 0 && (
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Nenhuma rodada finalizada</p>
          </div>
        )}
        {Object.entries(grouped)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([round, matches]) => (
            <section key={round} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl">Rodada {round}</h2>
                <div className="flex-1 h-[3px] bg-black" />
              </div>
              <div className="space-y-3">
                {matches.map((m) => {
                  const p = data!.preds.find((x) => x.match_id === m.id);
                  return (
                    <ResultCard
                      key={m.id}
                      teamA={m.team_a}
                      teamB={m.team_b}
                      resultA={m.result_a}
                      resultB={m.result_b}
                      matchDate={m.match_date}
                      predictedA={p?.predicted_a}
                      predictedB={p?.predicted_b}
                      pointsEarned={p?.points_earned}
                    />
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
