import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPhaseName, getPhaseInfo } from "@/lib/phases";
import { formatMatchDate } from "@/lib/format";
import { fetchAuditDataServer } from "@/lib/api/auditoria.functions";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Copa Épica" }] }),
  component: AuditoriaPage,
});

type PlayerPrediction = {
  user_id: string;
  display_name: string;
  predicted_a: number | null;
  predicted_b: number | null;
  created_at: string | null;
  points_earned: number | null;
  is_correct: boolean | null;
};

type MatchAudit = {
  id: string;
  team_a: string;
  team_b: string;
  match_date: string;
  round_number: number;
  result_a: number;
  result_b: number;
  predictions: PlayerPrediction[];
};

type RoundGroup = {
  round: number;
  phase: string;
  matches: MatchAudit[];
};

async function fetchAuditData(): Promise<RoundGroup[]> {
  const { matches, predictions, profiles } = await fetchAuditDataServer();

  if (!matches.length) return [];

  const matchIds = new Set(matches.map((m) => m.id));

  const predsByMatch = new Map<string, PlayerPrediction[]>();
  for (const pred of predictions) {
    if (!matchIds.has(pred.match_id)) continue;
    const existing = predsByMatch.get(pred.match_id);
    const entry: PlayerPrediction = {
      user_id: pred.user_id,
      display_name: "Desconhecido",
      predicted_a: pred.predicted_a,
      predicted_b: pred.predicted_b,
      created_at: pred.created_at,
      points_earned: pred.points_earned ?? 0,
      is_correct: pred.is_correct ?? false,
    };
    if (existing) {
      existing.push(entry);
    } else {
      predsByMatch.set(pred.match_id, [entry]);
    }
  }

  for (const predList of predsByMatch.values()) {
    for (const p of predList) {
      for (const prof of profiles) {
        if (prof.id === p.user_id) {
          p.display_name = prof.display_name;
          break;
        }
      }
    }
  }

  const matchMap: MatchAudit[] = [];
  for (const m of matches) {
    const existingPreds = predsByMatch.get(m.id) ?? [];
    const existingUserIds = new Set(existingPreds.map((p) => p.user_id));

    const allMatchPreds: PlayerPrediction[] = [...existingPreds];
    for (const prof of profiles) {
      if (!existingUserIds.has(prof.id)) {
        allMatchPreds.push({
          user_id: prof.id,
          display_name: prof.display_name,
          predicted_a: null,
          predicted_b: null,
          created_at: null,
          points_earned: null,
          is_correct: null,
        });
      }
    }

    matchMap.push({
      id: m.id,
      team_a: m.team_a,
      team_b: m.team_b,
      match_date: m.match_date,
      round_number: m.round_number,
      result_a: m.result_a!,
      result_b: m.result_b!,
      predictions: allMatchPreds,
    });
  }

  const roundMap = new Map<number, MatchAudit[]>();
  for (const m of matchMap) {
    const list = roundMap.get(m.round_number);
    if (list) {
      list.push(m);
    } else {
      roundMap.set(m.round_number, [m]);
    }
  }

  const rounds: RoundGroup[] = [];
  for (const [round, ms] of roundMap) {
    rounds.push({
      round,
      phase: getPhaseName(ms[0].match_date),
      matches: ms,
    });
  }
  rounds.sort((a, b) => b.round - a.round);

  return rounds;
}

function formatPredictionDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditoriaPage() {
  const { user } = Route.useRouteContext();

  const { data: rounds, isLoading } = useQuery({
    queryKey: ["auditoria"],
    queryFn: fetchAuditData,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300">
        <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
          <div className="flex items-center gap-3">
            <Link to="/ranking" className="hover:brightness-110 transition-all">
              <ChevronLeft className="size-6" />
            </Link>
            <h1 className="text-4xl font-display tracking-wider">AUDITORIA</h1>
          </div>
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="brutal-border bg-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-48 mb-2" />
              <div className="h-8 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rounds || rounds.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
          <div className="flex items-center gap-3">
            <Link to="/ranking" className="hover:brightness-110 transition-all">
              <ChevronLeft className="size-6" />
            </Link>
            <h1 className="text-4xl font-display tracking-wider">AUDITORIA</h1>
          </div>
        </header>
        <div className="p-4">
          <div className="bg-card brutal-border p-6 text-center">
            <p className="font-display text-2xl">Nenhuma rodada finalizada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os dados aparecerão aqui assim que os jogos forem encerrados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AuditoriaContent rounds={rounds} userId={user.id} />;
}

function AuditoriaContent({ rounds, userId }: { rounds: RoundGroup[]; userId: string }) {
  const [selectedRound, setSelectedRound] = useState(rounds[0].round);
  const [filter, setFilter] = useState<"todos" | "meus">("todos");

  const currentRound = rounds.find((r) => r.round === selectedRound) ?? rounds[0];

  return (
    <div className="animate-in fade-in duration-300">
      <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
        <div className="flex items-center gap-3">
          <Link to="/ranking" className="hover:brightness-110 transition-all">
            <ChevronLeft className="size-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-display tracking-wider leading-none">
              AUDITORIA
            </h1>
            <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
              {rounds.length} rodada{rounds.length !== 1 ? "s" : ""} com resultados
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rounds.map((r) => {
            const phaseInfo = getPhaseInfo(r.phase);
            const isActive = r.round === selectedRound;
            return (
              <button
                key={r.round}
                onClick={() => setSelectedRound(r.round)}
                className={`shrink-0 brutal-border px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${
                  isActive
                    ? "bg-[color:var(--brand-blue)] text-white"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                {phaseInfo.emoji} Rodada {r.round}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("todos")}
            className={`flex-1 brutal-border px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${
              filter === "todos"
                ? "bg-[color:var(--brand-blue)] text-white"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            TODOS
          </button>
          <button
            onClick={() => setFilter("meus")}
            className={`flex-1 brutal-border px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${
              filter === "meus"
                ? "bg-[color:var(--brand-blue)] text-white"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            MEUS PALPITES
          </button>
        </div>

        {currentRound.matches.map((match) => {
          const myPrediction = match.predictions.find((p) => p.user_id === userId);

          const displayedPredictions =
            filter === "meus"
              ? myPrediction
                ? [myPrediction]
                : []
              : match.predictions;

          return (
            <div key={match.id}>
              <div className="bg-card brutal-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b-[3px] border-border flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold tracking-widest">
                    {formatMatchDate(match.match_date)}
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    {getPhaseInfo(currentRound.phase).label}
                  </p>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <p className="font-display text-xl text-right flex-1">{match.team_a}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-3xl bg-[color:var(--brand-blue)] text-white brutal-border px-3 py-1">
                        {match.result_a}
                      </span>
                      <span className="font-display text-lg text-muted-foreground">×</span>
                      <span className="font-display text-3xl bg-[color:var(--brand-blue)] text-white brutal-border px-3 py-1">
                        {match.result_b}
                      </span>
                    </div>
                    <p className="font-display text-xl flex-1">{match.team_b}</p>
                  </div>

                  {displayedPredictions.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      Você não palpou nesta partida.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase font-bold tracking-widest border-b-[3px] border-border">
                            <th className="pb-2 pr-2">Participante</th>
                            <th className="pb-2 pr-2 text-center">Palpite</th>
                            <th className="pb-2 pr-2 text-center">Resultado</th>
                            <th className="pb-2 pr-2 text-center">Acertou?</th>
                            <th className="pb-2 pr-2 text-right">Pontos</th>
                            <th className="pb-2 text-right whitespace-nowrap">Data do palpite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedPredictions.map((p) => {
                            const temPalpite = p.predicted_a !== null;
                            return (
                              <tr
                                key={p.user_id}
                                className="border-b border-border/10 text-sm transition-all hover:bg-muted"
                              >
                                <td className="py-2 pr-2 font-bold uppercase align-middle">
                                  {p.display_name}
                                </td>
                                <td className="py-2 pr-2 text-center font-mono font-bold align-middle">
                                  {temPalpite ? `${p.predicted_a}×${p.predicted_b}` : "—"}
                                </td>
                                <td className="py-2 pr-2 text-center font-mono align-middle text-muted-foreground">
                                  {match.result_a}×{match.result_b}
                                </td>
                                <td className="py-2 pr-2 text-center align-middle">
                                  {temPalpite ? (
                                    p.is_correct ? (
                                      <span className="text-[color:var(--brand-green)] font-bold text-sm">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-red-500 font-bold text-sm">
                                        ✗
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </td>
                                <td className="py-2 pr-2 text-right font-display text-lg align-middle">
                                  {temPalpite ? p.points_earned : <span className="text-muted-foreground font-sans text-xs">—</span>}
                                </td>
                                <td className="py-2 text-right text-[10px] text-muted-foreground align-middle whitespace-nowrap">
                                  {temPalpite ? formatPredictionDate(p.created_at!) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
