import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { RankingCard, PodiumCard } from "@/components/RankingCard";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Copa Épica" }] }),
  component: RankingPage,
});

type Row = {
  id: string;
  display_name: string;
  points: number;
  correct_guesses: number;
};

async function fetchRanking() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,points,correct_guesses")
    .order("points", { ascending: false })
    .order("correct_guesses", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Row[];
}

function RankingPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ranking"], queryFn: fetchRanking });

  useEffect(() => {
    const ch = supabase
      .channel("ranking-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => qc.invalidateQueries({ queryKey: ["ranking"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const top3 = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];

  return (
    <div>
      <PageHeader title="Ranking" subtitle="Os feras da copa épica" />
      <div className="p-4 space-y-5">
        {isLoading && <p className="text-center font-bold uppercase">Carregando...</p>}

        {top3.length >= 1 && (
          <div className="bg-[color:var(--brand-blue)] brutal-border brutal-shadow p-4">
            <div className="flex items-end gap-2">
              {top3[1] && <PodiumCard position={2} name={top3[1].display_name} points={top3[1].points} />}
              {top3[0] && <PodiumCard position={1} name={top3[0].display_name} points={top3[0].points} />}
              {top3[2] && <PodiumCard position={3} name={top3[2].display_name} points={top3[2].points} />}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rest.map((r, i) => (
            <RankingCard
              key={r.id}
              rank={i + 4}
              name={r.display_name}
              points={r.points}
              correct={r.correct_guesses}
              isMe={r.id === user.id}
            />
          ))}
        </div>

        {data?.length === 0 && (
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Ninguém pontuou ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
