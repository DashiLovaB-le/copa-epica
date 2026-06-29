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
  total_score_diff: number;
  first_prediction_at: string;
};

type ProfileWithRank = Profile & { rank: number };

async function fetchRanking() {
  const [profilesRes, predictionsRes, matchesRes] = await Promise.all([
    supabase
      .from("copaepica_profiles")
      .select("id,display_name,points,correct_guesses")
      .limit(100),
    supabase
      .from("copaepica_predictions")
      .select("user_id, match_id, predicted_a, predicted_b, created_at"),
    supabase
      .from("copaepica_matches")
      .select("id, result_a, result_b")
      .not("result_a", "is", null),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (predictionsRes.error) throw predictionsRes.error;
  if (matchesRes.error) throw matchesRes.error;

  const resultMap = new Map(
    (matchesRes.data ?? []).map((m) => [m.id, m]),
  );

  const scoreDiffMap = new Map<string, number>();
  const firstPredMap = new Map<string, string>();

  for (const pred of predictionsRes.data ?? []) {
    const match = resultMap.get(pred.match_id);
    if (!match) continue;
    const diff =
      Math.abs(pred.predicted_a - match.result_a!) +
      Math.abs(pred.predicted_b - match.result_b!);
    scoreDiffMap.set(
      pred.user_id,
      (scoreDiffMap.get(pred.user_id) ?? 0) + diff,
    );
    const existing = firstPredMap.get(pred.user_id);
    if (!existing || pred.created_at < existing) {
      firstPredMap.set(pred.user_id, pred.created_at);
    }
  }

  const ranked = (profilesRes.data ?? [])
    .map((p) => ({
      ...p,
      total_score_diff: scoreDiffMap.get(p.id) ?? 0,
      first_prediction_at: firstPredMap.get(p.id) ?? "",
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.total_score_diff !== b.total_score_diff)
        return a.total_score_diff - b.total_score_diff;
      if (a.first_prediction_at && b.first_prediction_at)
        return a.first_prediction_at.localeCompare(b.first_prediction_at);
      return 0;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return ranked as ProfileWithRank[];
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
      <div className="animate-in fade-in duration-200">
        <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
          <h1 className="text-4xl font-display tracking-wider">RANKING GERAL</h1>
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="brutal-border bg-white p-4 animate-pulse">
              <div className="h-5 w-24 bg-neutral-200 mb-2" />
              <div className="h-8 w-32 bg-neutral-200" />
            </div>
          ))}
          <div className="h-0 border-t-[3px] border-black" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-neutral-200" />
              <div className="flex-1 h-5 bg-neutral-200" />
              <div className="w-12 h-5 bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const participants = ranking ?? [];
  const userEntry = participants.find((p) => p.id === user.id);
  const top3 = participants.slice(0, 3);
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

        {participants.length > 0 && (
          <>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-widest mb-3">
                TABELA COMPLETA
              </p>
              <div className="bg-white brutal-border overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-[3px] border-black text-[10px] uppercase font-bold tracking-widest">
                      <th className="p-3 w-14 text-center">#</th>
                      <th className="p-3">Participante</th>
                      <th className="p-3 text-center">Acertos</th>
                      <th className="p-3 text-right">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((r, i) => {
                      const isMe = r.id === user.id;
                      return (
                        <tr
                          key={r.id}
                          className={`animate-in fade-in slide-in-from-bottom-1 duration-200 border-b border-black/10 text-sm transition-all hover:bg-neutral-100 ${
                            isMe ? "bg-[color:var(--brand-yellow)] ring-2 ring-black hover:bg-[color:var(--brand-yellow)]" : ""
                          }`}
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 font-display text-lg ${
                                r.rank <= 3
                                  ? "bg-[color:var(--brand-blue)] text-white"
                                  : "text-black"
                              }`}
                            >
                              {r.rank}
                            </span>
                          </td>
                          <td className="p-3 font-bold uppercase">
                            <span className="flex items-center gap-2">
                              {r.display_name}
                              {isMe && (
                                <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 leading-none shrink-0">
                                  VOCÊ
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-black/60">
                            {r.correct_guesses}
                          </td>
                          <td className="p-3 text-right font-display text-xl leading-none">
                            {r.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      className={`brutal-border p-3 text-center flex flex-col items-center transition-all duration-100 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] ${className}`}
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
