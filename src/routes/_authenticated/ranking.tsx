import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Copa Épica" }] }),
  component: RankingPage,
});

type Profile = {
  id: string;
  display_name: string;
  points: number;
  correct_guesses: number;
};

type ProfileWithRank = Profile & { rank: number };

async function fetchRanking() {
  const { data, error } = await supabase
    .from("copaepica_profiles")
    .select("id,display_name,points,correct_guesses")
    .order("points", { ascending: false })
    .order("correct_guesses", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((p, i) => ({ ...p, rank: i + 1 })) as ProfileWithRank[];
}

async function fetchLatestRound() {
  const { data, error } = await supabase
    .from("copaepica_matches")
    .select("round_number")
    .not("result_a", "is", null)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.round_number ?? null;
}

function RankingPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: ranking, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: fetchRanking,
  });

  const { data: latestRound } = useQuery({
    queryKey: ["latest-round"],
    queryFn: fetchLatestRound,
  });

  useEffect(() => {
    const ch = supabase
      .channel("ranking-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_profiles" },
        () => qc.invalidateQueries({ queryKey: ["ranking"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  if (isLoading) {
    return (
      <div>
        <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
          <h1 className="text-4xl font-display tracking-wider">RANKING GERAL</h1>
        </header>
        <div className="p-4">
          <p className="text-center font-bold uppercase mt-8">Carregando...</p>
        </div>
      </div>
    );
  }

  const participants = ranking ?? [];
  const userEntry = participants.find((p) => p.id === user.id);
  const top3 = participants.slice(0, 3);
  const rest = participants.slice(3);
  const maxPoints = participants.length > 0 ? participants[0].points : 0;
  const gapToTop3 =
    userEntry && top3.length === 3 && userEntry.rank > 3
      ? top3[2].points - userEntry.points
      : null;

  return (
    <div>
      <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
        <h1 className="text-4xl font-display tracking-wider leading-none">
          RANKING GERAL
        </h1>
        <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
          {participants.length} participantes
          {latestRound ? `  ·  Atualizado após a Rodada ${latestRound}` : ""}
        </p>
      </header>

      <div className="p-4 space-y-6">
        <div className="h-0 border-t-[3px] border-black" />

        {userEntry && (
          <>
            <div className="bg-white brutal-border brutal-shadow p-5 flex flex-col items-center gap-1">
              <p className="text-[11px] uppercase font-bold tracking-widest text-black/60">
                SUA POSIÇÃO
              </p>
              <p className="font-display text-6xl leading-none text-[color:var(--brand-blue)]">
                #{userEntry.rank}
              </p>
              <p className="font-display text-3xl leading-none">
                {userEntry.points}{" "}
                <span className="font-sans text-sm font-bold text-black/60 uppercase">
                  pontos
                </span>
              </p>
              {gapToTop3 !== null && gapToTop3 > 0 && (
                <p className="text-[11px] uppercase font-bold tracking-widest text-black/60">
                  Faltam {gapToTop3} pontos para o Top 3
                </p>
              )}
              {userEntry.rank <= 3 && (
                <p className="text-[11px] uppercase font-bold tracking-widest text-[color:var(--brand-green)]">
                  VOCÊ ESTÁ NO PÓDIO!
                </p>
              )}
            </div>
            <div className="h-0 border-t-[3px] border-black" />
          </>
        )}

        {top3.length > 0 && (
          <>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-widest mb-3 text-center">
                PÓDIO
              </p>
              <div className="grid grid-cols-3 gap-3 items-end">
                {top3[1] && (
                  <PodiumCard
                    position={2}
                    name={top3[1].display_name}
                    points={top3[1].points}
                    className="bg-[color:var(--brand-yellow)] text-black"
                  />
                )}
                {top3[0] && (
                  <PodiumCard
                    position={1}
                    name={top3[0].display_name}
                    points={top3[0].points}
                    className="bg-[color:var(--brand-green)] text-white"
                  />
                )}
                {top3[2] && (
                  <PodiumCard
                    position={3}
                    name={top3[2].display_name}
                    points={top3[2].points}
                    className="bg-white text-black"
                  />
                )}
              </div>
            </div>
            <div className="h-0 border-t-[3px] border-black" />
          </>
        )}

        {rest.length > 0 && (
          <>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-widest mb-3">
                CLASSIFICAÇÃO
              </p>
              <div className="space-y-2">
                {rest.map((r) => {
                  const isMe = r.id === user.id;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-4 brutal-border p-3 ${
                        isMe
                          ? "bg-[color:var(--brand-yellow)] ring-2 ring-black"
                          : "bg-white"
                      }`}
                    >
                      <div className="w-12 h-12 shrink-0 brutal-border bg-[color:var(--brand-blue)] text-white flex items-center justify-center font-display text-2xl">
                        {r.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold uppercase truncate">
                          {r.display_name}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
                          {r.correct_guesses} acertos
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-3xl leading-none">
                          {r.points}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
                          pts
                        </p>
                      </div>
                      {isMe && (
                        <span className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 -mr-1 shrink-0">
                          VOCÊ
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-0 border-t-[3px] border-black" />
          </>
        )}

        {userEntry && participants.length > 0 && (
          <div>
            <p className="text-[11px] uppercase font-bold tracking-widest mb-3">
              ESTATÍSTICAS
            </p>
            <div className="bg-white brutal-border p-4 space-y-3">
              <StatRow label="Maior pontuação" value={String(maxPoints)} />
              <StatRow label="Sua pontuação" value={String(userEntry.points)} />
              <StatRow
                label="Diferença para líder"
                value={String(maxPoints - userEntry.points)}
              />
              <StatRow label="Posição atual" value={`${userEntry.rank}º`} />
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Ninguém pontuou ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  position,
  name,
  points,
  className,
}: {
  position: 1 | 2 | 3;
  name: string;
  points: number;
  className: string;
}) {
  const emoji = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div
      className={`brutal-border p-3 text-center flex flex-col items-center ${className}`}
    >
      <p className="text-2xl mb-1">{emoji[position]}</p>
      <p className="font-bold uppercase text-xs truncate w-full">{name}</p>
      <p className="font-display text-xl leading-none">{points} PTS</p>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] uppercase font-bold tracking-widest">
        {label}
      </span>
      <span className="font-display text-2xl leading-none">{value}</span>
    </div>
  );
}
