import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMatchDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { updateResults } from "@/lib/api/update-results.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rodadas")({
  head: () => ({ meta: [{ title: "Rodadas — Copa Épica" }] }),
  component: RodadasPage,
});

const COUNTRY_FLAGS: Record<string, string> = {
  Brasil: "🇧🇷", Argentina: "🇦🇷", França: "🇫🇷", Alemanha: "🇩🇪",
  Espanha: "🇪🇸", Itália: "🇮🇹", Portugal: "🇵🇹", Holanda: "🇳🇱",
  Inglaterra: "🇬🇧", Bélgica: "🇧🇪", Croácia: "🇭🇷", Sérvia: "🇷🇸",
  Suíça: "🇨🇭", Dinamarca: "🇩🇰", Polônia: "🇵🇱", México: "🇲🇽",
  "Estados Unidos": "🇺🇸", EUA: "🇺🇸", Canadá: "🇨🇦", Japão: "🇯🇵",
  "Coreia do Sul": "🇰🇷", Austrália: "🇦🇺", Uruguai: "🇺🇾",
  Colômbia: "🇨🇴", Equador: "🇪🇨", Peru: "🇵🇪", Chile: "🇨🇱",
  Suécia: "🇸🇪", Noruega: "🇳🇴", Ucrânia: "🇺🇦", Marrocos: "🇲🇦",
  Senegal: "🇸🇳", Nigéria: "🇳🇬", Camarões: "🇨🇲", Gana: "🇬🇭",
  Egito: "🇪🇬", Tunísia: "🇹🇳",
};

function getFlag(name: string): string {
  return COUNTRY_FLAGS[name] ?? "";
}

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
  is_correct: boolean | null;
};

async function fetchRounds(userId: string) {
  const [m, p] = await Promise.all([
    supabase
      .from("copaepica_matches")
      .select("*")
      .not("result_a", "is", null)
      .not("result_b", "is", null)
      .order("round_number", { ascending: true })
      .order("match_date", { ascending: true }),
    supabase
      .from("copaepica_predictions")
      .select("match_id,predicted_a,predicted_b,points_earned,is_correct")
      .eq("user_id", userId),
  ]);
  if (m.error) throw m.error;
  if (p.error) throw p.error;
  return { matches: (m.data ?? []) as MatchRow[], preds: (p.data ?? []) as Pred[] };
}

function RodadasPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  async function handleUpdate() {
    setUpdating(true);
    try {
      const result = await updateResults();
      const total = result.updated.length + result.failed.length;
      if (result.updated.length > 0) {
        toast.success(`${result.updated.length}/${total} jogos atualizados`);
      } else if (result.failed.length > 0) {
        toast.info(`Nenhum resultado novo encontrado (${result.failed.length} pendentes)`);
      } else {
        toast.info("Nenhum jogo pendente para atualizar");
      }
      qc.invalidateQueries({ queryKey: ["rodadas"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar resultados");
    } finally {
      setUpdating(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["rodadas", user.id],
    queryFn: () => fetchRounds(user.id),
  });

  useEffect(() => {
    const ch = supabase
      .channel("rodadas-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_matches" },
        () => qc.invalidateQueries({ queryKey: ["rodadas"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_predictions" },
        () => qc.invalidateQueries({ queryKey: ["rodadas"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const grouped = (data?.matches ?? []).reduce<Record<number, MatchRow[]>>((acc, m) => {
    (acc[m.round_number] ||= []).push(m);
    return acc;
  }, {});

  const roundNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  const activeRound = selectedRound ?? (roundNumbers.length > 0 ? roundNumbers[roundNumbers.length - 1] : null);
  const currentMatches = activeRound != null ? grouped[activeRound] ?? [] : [];

  const roundPreds = currentMatches.map((m) => {
    const p = data?.preds.find((x) => x.match_id === m.id) ?? null;
    return { match: m, pred: p };
  });

  const totalJogos = currentMatches.length;
  const acertos = roundPreds.filter((rp) => rp.pred?.is_correct === true).length;
  const erros = roundPreds.filter((rp) => rp.pred != null && rp.pred.is_correct === false).length;
  const pontosRodada = roundPreds.reduce((sum, rp) => sum + (rp.pred?.points_earned ?? 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-display text-3xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="RODADAS"
        subtitle="Histórico de resultados"
        right={
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-shrink-0 bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow px-4 py-2 font-display text-lg tracking-wider active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow"
          >
            {updating ? "..." : "ATUALIZAR"}
          </button>
        }
      />

      {roundNumbers.length === 0 ? (
        <div className="p-4">
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Nenhuma rodada finalizada</p>
            <p className="text-sm mt-2 uppercase font-bold tracking-wider text-black/60">
              Os resultados aparecerão aqui conforme os jogos terminarem
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex overflow-x-auto brutal-border border-x-0 border-t-0">
            {roundNumbers.map((rn) => (
              <button
                key={rn}
                onClick={() => setSelectedRound(rn)}
                className={`flex-shrink-0 px-5 py-3 font-bold text-xs uppercase tracking-widest transition-colors ${
                  activeRound === rn
                    ? "bg-[color:var(--brand-yellow)] text-black"
                    : "bg-white text-black/60 hover:bg-neutral-100"
                }`}
              >
                RODADA {rn}
              </button>
            ))}
          </div>

          {activeRound != null && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[3px] bg-black" />
                <h2 className="font-display text-3xl whitespace-nowrap">RODADA {activeRound}</h2>
                <div className="flex-1 h-[3px] bg-black" />
              </div>

              <div className="bg-white brutal-border p-4 space-y-1">
                <p className="text-sm font-bold uppercase tracking-wider">
                  Jogos: {totalJogos}
                </p>
                <p className="text-sm font-bold uppercase tracking-wider">
                  Seus acertos: {acertos}
                </p>
                <p className="text-sm font-bold uppercase tracking-wider">
                  Pontos ganhos: {pontosRodada}
                </p>
              </div>

              <div className="space-y-3">
                {roundPreds.map(({ match: m, pred: p }) => {
                  const hasPrediction = p != null;
                  const isCorrect = p?.is_correct === true;
                  const points = p?.points_earned ?? 0;
                  const flagA = getFlag(m.team_a);
                  const flagB = getFlag(m.team_b);

                  return (
                    <article
                      key={m.id}
                      className={`brutal-border p-4 ${
                        isCorrect
                          ? "bg-[color:var(--brand-green)] text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-display text-3xl">
                          {flagA} {m.team_a} {m.result_a} × {m.result_b} {m.team_b} {flagB}
                        </p>
                      </div>

                      <div className="border-t border-black/10 mt-3 pt-3 text-center">
                        {hasPrediction && (
                          <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">
                            SEU PALPITE
                          </p>
                        )}
                        <p className={`font-display text-3xl mt-1 ${isCorrect ? "text-white" : ""}`}>
                          {hasPrediction
                            ? `${p.predicted_a} × ${p.predicted_b}`
                            : "Sem palpite"}
                        </p>
                      </div>

                      {hasPrediction && (
                        <div className="mt-3 flex items-center justify-center gap-3">
                          <span className="font-display text-lg tracking-wider">
                            {isCorrect ? "✓ ACERTOU" : "✗ ERROU"}
                          </span>
                          <span
                            className={`px-2 py-1 brutal-border font-bold text-xs tracking-wider ${
                              isCorrect
                                ? "bg-[color:var(--brand-yellow)] text-black"
                                : "bg-black text-white"
                            }`}
                          >
                            {isCorrect ? `+${points}` : "+0"} PONTOS
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[3px] bg-black" />
                <h2 className="font-display text-3xl whitespace-nowrap">RESUMO DA RODADA</h2>
                <div className="flex-1 h-[3px] bg-black" />
              </div>

              <div className="bg-white brutal-border brutal-shadow p-4 space-y-1">
                <p className="text-sm font-bold uppercase tracking-wider">
                  Acertos: {acertos}
                </p>
                <p className="text-sm font-bold uppercase tracking-wider">
                  Erros: {erros}
                </p>
                <p className="text-sm font-bold uppercase tracking-wider">
                  Pontos obtidos: {pontosRodada}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
