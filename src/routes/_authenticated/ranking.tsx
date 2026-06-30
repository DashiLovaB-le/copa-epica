import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

type RoundFeedback = {
  round: number;
  entries: {
    display_name: string;
    points_earned: number;
    correct_count: number;
    total_points: number;
  }[];
};

async function fetchRoundFeedback(): Promise<RoundFeedback | null> {
  const { data: roundNumbers } = await supabase
    .from("copaepica_matches")
    .select("round_number")
    .not("result_a", "is", null)
    .order("round_number", { ascending: false });

  if (!roundNumbers?.length) return null;

  const uniqueRounds = [...new Set(roundNumbers.map(r => r.round_number))];

  for (const round of uniqueRounds) {
    const { data: matches } = await supabase
      .from("copaepica_matches")
      .select("id")
      .eq("round_number", round)
      .not("result_a", "is", null);
    if (!matches?.length) continue;

    const matchIds = matches.map(m => m.id);

    const { data: preds } = await supabase
      .from("copaepica_predictions")
      .select("user_id, points_earned, is_correct")
      .in("match_id", matchIds)
      .limit(1);

    if (preds?.length) {
      const { data: profiles } = await supabase
        .from("copaepica_profiles")
        .select("id, display_name, points");
      if (!profiles?.length) return null;

      const { data: allPreds } = await supabase
        .from("copaepica_predictions")
        .select("user_id, points_earned, is_correct")
        .in("match_id", matchIds);

      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const acc = new Map<string, { points_earned: number; correct_count: number }>();

      for (const p of allPreds ?? []) {
        const entry = acc.get(p.user_id) || { points_earned: 0, correct_count: 0 };
        entry.points_earned += p.points_earned ?? 0;
        if (p.is_correct) entry.correct_count++;
        acc.set(p.user_id, entry);
      }

      const entries = Array.from(acc.entries())
        .filter(([id]) => profileMap.has(id))
        .map(([id, data]) => ({
          display_name: profileMap.get(id)!.display_name,
          points_earned: data.points_earned,
          correct_count: data.correct_count,
          total_points: profileMap.get(id)!.points,
        }))
        .sort((a, b) => b.points_earned - a.points_earned);

      return { round, entries };
    }
  }

  return null;
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

  const { data: roundFeedback } = useQuery({
    queryKey: ["round-feedback"],
    queryFn: fetchRoundFeedback,
  });

  useEffect(() => {
    let mounted = true;
    const cb = () => { if (mounted) qc.invalidateQueries({ queryKey: ["ranking"] }); };
    const ch = supabase
      .channel("ranking-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "copaepica_profiles" }, cb)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [qc]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300" style={{ viewTransitionName: "page-ranking" } as any}>
        <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
          <h1 className="text-4xl font-display tracking-wider">RANKING GERAL</h1>
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="brutal-border bg-white p-4 animate-in fade-in duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
          <div className="h-0 border-t-[3px] border-black" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 animate-in fade-in duration-200"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Skeleton className="w-8 h-8" />
              <Skeleton className="flex-1 h-5" />
              <Skeleton className="w-12 h-5" />
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
    <div style={{ viewTransitionName: "page-ranking" } as any}>
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
              <div className="grid grid-cols-3 items-end gap-2">
                <div className="flex justify-center">
                  {top3[1] && (
                    <PodiumCard
                      position={2}
                      name={top3[1].display_name}
                      points={top3[1].points}
                      className="bg-[color:var(--brand-yellow)] text-black"
                      heightClass="pt-6 pb-2"
                    />
                  )}
                </div>
                <div className="flex justify-center">
                  {top3[0] && (
                    <PodiumCard
                      position={1}
                      name={top3[0].display_name}
                      points={top3[0].points}
                      className="bg-[color:var(--brand-green)] text-white"
                      heightClass="pt-10 pb-2"
                    />
                  )}
                </div>
                <div className="flex justify-center">
                  {top3[2] && (
                    <PodiumCard
                      position={3}
                      name={top3[2].display_name}
                      points={top3[2].points}
                      className="bg-white text-black"
                      heightClass="pt-3 pb-2"
                    />
                  )}
                </div>
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
                      <th className="p-3 w-12 text-center">#</th>
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
                          <td className="p-3 text-center align-middle">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 font-display text-base ${
                                r.rank <= 3
                                  ? "bg-[color:var(--brand-blue)] text-white"
                                  : "text-black"
                              }`}
                            >
                              {r.rank}
                            </span>
                          </td>
                          <td className="p-3 font-bold uppercase align-middle">
                            <span className="flex items-center gap-2">
                              {r.display_name}
                              {isMe && (
                                <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 leading-none shrink-0">
                                  VOCÊ
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-black/60 align-middle">
                            {r.correct_guesses}
                          </td>
                          <td className="p-3 text-right font-display text-xl leading-none align-middle">
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
              <StatRow label="Diferença total nos placares" value={String(userEntry.total_score_diff)} />
            </div>
            <div className="mt-3 bg-neutral-50 brutal-border p-3 text-[11px] leading-relaxed text-black/70 space-y-1">
              <p className="font-bold text-black uppercase tracking-widest text-[10px]">Critério de desempate do Ranking</p>
              <p>O ranking é ordenado nesta sequência:</p>
              <p><strong>1º — Pontos totais</strong> (maior → menor)</p>
              <p><strong>2º — Placar mais próximo</strong> (soma da diferença absoluta entre palpite e resultado real em todos os jogos, menor → melhor)</p>
              <p className="text-[10px] pl-3">Exemplo: se um jogo terminou 3×1 e você palpou 2×0, a diferença é |2-3| + |0-1| = 2. Essa soma é acumulada para todos os jogos com resultado. Quem tiver a menor soma fica na frente.</p>
              <p><strong>3º — Data do palpite</strong> (desempate final: quem fez o primeiro palpite primeiro fica na frente)</p>
              <p>Isso garante que, mesmo que dois participantes tenham exatamente os mesmos pontos, o desempate será justo — primeiro pela precisão dos palpites (quem chutou mais perto), e depois por quem se comprometeu primeiro.</p>
            </div>
          </div>
        )}

        {roundFeedback && (
          <>
            <div className="h-0 border-t-[3px] border-black" />
            <div>
              <p className="text-[11px] uppercase font-bold tracking-widest mb-3">
                ⚡ FECHAMENTO DA RODADA {roundFeedback.round}
              </p>
              <div className="bg-white brutal-border brutal-shadow p-4 space-y-3">
                {roundFeedback.entries.map((entry, i) => {
                  const isTop = i === 0;
                  return (
                    <div
                      key={entry.display_name}
                      className="flex justify-between items-center border-b border-black/5 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isTop && <span className="text-sm shrink-0">👑</span>}
                        <span className="font-bold uppercase text-xs truncate">
                          {entry.display_name}
                        </span>
                        <span className="text-[10px] text-black/40 whitespace-nowrap">
                          {entry.correct_count} acerto{entry.correct_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-display text-lg text-[color:var(--brand-green)]">
                          +{entry.points_earned}
                        </span>
                        <span className="text-[10px] text-black/40 ml-1">pts</span>
                        <span className="text-[10px] text-black/40 ml-2">
                          (total: {entry.total_points})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
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
  heightClass,
  className,
}: {
  position: 1 | 2 | 3;
  name: string;
  points: number;
  heightClass: string;
  className: string;
}) {
  const emoji = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div
      className={`brutal-border w-full text-center flex flex-col items-center transition-all duration-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] ${heightClass} ${className}`}
    >
      <p className="text-lg mb-0.5 leading-none">{emoji[position]}</p>
      <p className="font-bold uppercase text-[10px] truncate w-full leading-tight">{name}</p>
      <p className="font-display text-lg leading-none mt-0.5">{points} PTS</p>
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
