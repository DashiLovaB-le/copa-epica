import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreInput } from "@/components/ScoreInput";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMatchDate, formatCountdown } from "@/lib/format";
import { updateResults } from "@/lib/api/update-results.functions";
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
  points_earned: number | null;
  is_correct: boolean | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  points: number;
  correct_guesses: number;
};

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

const COUNTRY_ABBR: Record<string, string> = {
  Brasil: "BRA", Argentina: "ARG", França: "FRA", Alemanha: "GER",
  Espanha: "ESP", Portugal: "POR", Holanda: "NED", Inglaterra: "ENG",
  Bélgica: "BEL", Croácia: "CRO", Suíça: "SUI", México: "MEX",
  "Estados Unidos": "USA", Canadá: "CAN", Japão: "JPN",
  "Coreia do Sul": "KOR", Austrália: "AUS", Uruguai: "URU",
  Colômbia: "COL", Equador: "ECU", Suécia: "SWE", Noruega: "NOR",
  Marrocos: "MAR", Senegal: "SEN", Gana: "GHA", Egito: "EGY",
  Tunísia: "TUN", Paraguai: "PAR", Turquia: "TUR", Áustria: "AUT",
  Jordânia: "JOR", Argélia: "ALG", Iraque: "IRQ",
  "República Tcheca": "CZE", "África do Sul": "RSA",
  "Nova Zelândia": "NZL", "Cabo Verde": "CPV",
  "Arábia Saudita": "KSA", Irã: "IRN", Haiti: "HAI",
  Escócia: "SCO", "Bósnia e Herzegovina": "BIH", Catar: "QAT",
  Curaçao: "CUW", "Costa do Marfim": "CIV", "RD Congo": "COD",
  Uzbequistão: "UZB", Panamá: "PAN",
};

function getFlag(name: string): string {
  return COUNTRY_FLAGS[name] ?? "";
}

function getAbbr(name: string): string {
  return COUNTRY_ABBR[name] ?? name.slice(0, 3).toUpperCase();
}

type Filter = "todos" | "hoje" | "em-breve" | "encerrados";

async function fetchData(userId: string) {
  const [matches, preds, profileResult] = await Promise.all([
    supabase
      .from("copaepica_matches")
      .select("*")
      .gte("match_date", "2026-06-28")
      .order("match_date", { ascending: true }),
    supabase
      .from("copaepica_predictions")
      .select("match_id,predicted_a,predicted_b,points_earned,is_correct")
      .eq("user_id", userId),
    supabase
      .from("copaepica_profiles")
      .select("id,display_name,points,correct_guesses")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  if (matches.error) throw matches.error;
  if (preds.error) throw preds.error;
  if (profileResult.error) throw profileResult.error;

  return {
    matches: (matches.data ?? []) as MatchRow[],
    preds: (preds.data ?? []) as PredictionRow[],
    profile: profileResult.data as ProfileRow | null,
  };
}

function BouncingBall() {
  return (
    <span className="inline-flex items-center justify-center animate-bounce-ball text-xl leading-none">
      ⚽
    </span>
  );
}

function PalpitesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("todos");
  const [updating, setUpdating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["palpites", user.id],
    queryFn: () => fetchData(user.id),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    let mounted = true;
    const cb = () => { if (mounted) qc.invalidateQueries({ queryKey: ["palpites"] }); };
    const ch = supabase
      .channel("palpites-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "copaepica_matches" }, cb)
      .on("postgres_changes", { event: "*", schema: "public", table: "copaepica_predictions" }, cb)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [qc]);

  const allMatches = data?.matches ?? [];

  const availableMatches = useMemo(
    () => allMatches.filter((m) => m.result_a === null),
    [allMatches],
  );

  const currentRound = useMemo(() => {
    if (availableMatches.length > 0) return availableMatches[0].round_number;
    const lastCompleted = allMatches.filter((m) => m.result_a !== null).pop();
    if (lastCompleted) return lastCompleted.round_number;
    return 1;
  }, [availableMatches, allMatches]);

  const nextMatchCountdown = useMemo(() => {
    const now = Date.now();
    const nextMatch = availableMatches.find(
      (m) => new Date(m.match_date).getTime() > now,
    );
    if (!nextMatch) return null;
    return formatCountdown(new Date(nextMatch.match_date).getTime() - now);
  }, [availableMatches]);

  const filteredMatches = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(), today.getMonth(), today.getDate(),
    ).getTime();
    const endOfToday = startOfToday + 86400000;

    return allMatches.filter((m) => {
      const matchTime = new Date(m.match_date).getTime();
      switch (filter) {
        case "todos": return true;
        case "hoje": return matchTime >= startOfToday && matchTime < endOfToday;
        case "em-breve": return matchTime > now && m.result_a === null;
        case "encerrados": return m.result_a !== null;
      }
    });
  }, [allMatches, filter]);

  async function handleUpdate() {
    setUpdating(true);
    try {
      const result = await updateResults();
      const partes: string[] = [];
      if (result.synced.length > 0) partes.push(`${result.synced.length} novos jogos`);
      if (result.updated.length > 0) partes.push(`${result.updated.length} resultados`);
      if (result.failed.length > 0) partes.push(`${result.failed.length} falhas`);
      if (partes.length > 0) {
        toast.success(partes.join(", "));
      } else {
        toast.info("Nenhuma atualização disponível");
      }
      qc.invalidateQueries({ queryKey: ["palpites"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar resultados");
    } finally {
      setUpdating(false);
    }
  }

  async function savePrediction(matchId: string, a: number, b: number) {
    const { error } = await supabase
      .from("copaepica_predictions")
      .upsert(
        { user_id: user.id, match_id: matchId, predicted_a: a, predicted_b: b },
        { onConflict: "user_id,match_id" },
      );
    if (error) {
      toast.error(error.message);
      throw error;
    }
    qc.invalidateQueries({ queryKey: ["palpites"] });
    toast.success("Palpite salvo!");
  }

  if (isLoading) {
    return (
      <div className="pb-4 animate-in fade-in duration-300" style={{ viewTransitionName: "page-palpites" } as any}>
        <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
          <h1 className="text-4xl font-display tracking-wider leading-none">BOLÃO DA COPA</h1>
          <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
            Palpites
          </p>
        </header>
        <div className="bg-black text-white brutal-border border-x-0 border-t-0 p-4">
          <Skeleton className="h-6 w-32 bg-neutral-600" />
        </div>
        <div className="flex brutal-border border-x-0 border-t-0">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-1 h-11 bg-neutral-200" />
          ))}
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="brutal-border bg-white dark:bg-card p-4 space-y-3 animate-in fade-in duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Skeleton className="h-5 w-48 mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4" style={{ viewTransitionName: "page-palpites" } as any}>
      <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display tracking-wider leading-none">BOLÃO DA COPA</h1>
            <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
              Palpites da Rodada {currentRound}
            </p>
          </div>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-shrink-0 bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow px-4 py-2 font-display text-lg tracking-wider active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow flex items-center justify-center min-w-[120px]"
          >
            {updating ? <BouncingBall /> : "ATUALIZAR"}
          </button>
        </div>
      </header>

      <div className="bg-black text-white brutal-border border-x-0 border-t-0 p-4 flex items-center justify-between">
        {data?.profile ? (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">
              {data.profile.points} pts
            </span>
          </div>
        ) : null}
        {nextMatchCountdown && (
          <p className="text-xs uppercase font-bold tracking-widest opacity-80">
            Próximo jogo em {nextMatchCountdown}
          </p>
        )}
      </div>

      <div className="flex brutal-border border-x-0 border-t-0">
        {(["todos", "hoje", "em-breve", "encerrados"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest transition-colors ${
              filter === f
                ? "bg-[color:var(--brand-yellow)] text-black"
                : "bg-white dark:bg-card text-black/60 dark:text-white/60 hover:bg-neutral-100"
            }`}
          >
            {f === "em-breve" ? "EM BREVE" : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white dark:bg-card brutal-border p-6 text-center">
            <p className="font-display text-2xl">Nenhum jogo encontrado</p>
            <p className="text-sm mt-2 uppercase font-bold tracking-wider text-black/60 dark:text-white/60">
              {filter === "hoje"
                ? "Nenhum jogo hoje"
                : filter === "encerrados"
                  ? "Aguardando resultados..."
                  : "Volte em breve para palpitar"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60">
              {filter === "todos"
                ? "TODOS OS JOGOS"
                : filter === "hoje"
                  ? "JOGOS DE HOJE"
                  : filter === "em-breve"
                    ? "PRÓXIMOS JOGOS"
                    : "JOGOS ENCERRADOS"}
            </p>
            {filteredMatches.map((m, i) =>
              m.result_a !== null ? (
                <div
                  key={m.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ResultBlock
                    match={m}
                    prediction={
                      (data?.preds ?? []).find((x) => x.match_id === m.id)
                    }
                  />
                </div>
              ) : (
                <div
                  key={m.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <GameCard
                    match={m}
                    prediction={
                      (data?.preds ?? []).find((x) => x.match_id === m.id)
                    }
                    started={new Date(m.match_date).getTime() <= Date.now()}
                    onSave={(a, b) => savePrediction(m.id, a, b)}
                  />
                </div>
              ),
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GameCard({
  match,
  prediction,
  started,
  onSave,
}: {
  match: MatchRow;
  prediction: PredictionRow | undefined;
  started: boolean;
  onSave: (a: number, b: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(!prediction && !started);
  const [a, setA] = useState<number | "">(prediction?.predicted_a ?? "");
  const [b, setB] = useState<number | "">(prediction?.predicted_b ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const hasPrediction = prediction != null;
  const flagA = getFlag(match.team_a);
  const flagB = getFlag(match.team_b);

  async function handleSave() {
    if (a === "" || b === "") return;
    setSaving(true);
    try {
      await onSave(a, b);
      if (!mounted.current) return;
      setJustSaved(true);
      setEditing(false);
      setTimeout(() => { if (mounted.current) setJustSaved(false); }, 2000);
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  if (started) {
    return (
      <article className="bg-white dark:bg-card brutal-border brutal-shadow p-4">
        <div className="text-center space-y-1">
          <p className="font-display text-2xl">{match.team_a} {flagA}</p>
          <p className="font-display text-lg text-black/40 dark:text-white/40">VS</p>
          <p className="font-display text-2xl">{flagB} {match.team_b}</p>
          <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60 mt-2">
            {formatMatchDate(match.match_date)}
          </p>
        </div>
        {hasPrediction && (
          <>
            <div className="border-t border-black/10 dark:border-white/10 mt-3 pt-3 text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60">
                SEU PALPITE
              </p>
              <p className="font-display text-4xl mt-1">
                {prediction.predicted_a} × {prediction.predicted_b}
              </p>
            </div>
            <div className="mt-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-center py-3 font-display text-xl tracking-wider brutal-border">
              PALPITE ENCERRADO
            </div>
          </>
        )}
      </article>
    );
  }

  if (!editing && hasPrediction) {
    return (
      <article className="bg-white dark:bg-card brutal-border brutal-shadow-blue p-4">
        <div className="text-center space-y-1">
          <p className="font-display text-2xl">{match.team_a} {flagA}</p>
          <p className="font-display text-lg text-black/40 dark:text-white/40">VS</p>
          <p className="font-display text-2xl">{flagB} {match.team_b}</p>
          <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60 mt-2">
            {formatMatchDate(match.match_date)}
          </p>
        </div>
        <div className="border-t border-black/10 dark:border-white/10 mt-3 pt-3 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60">
            SEU PALPITE
          </p>
          <p className="font-display text-4xl mt-1">
            {prediction.predicted_a} × {prediction.predicted_b}
          </p>
        </div>
        {justSaved ? (
          <div className="mt-3 bg-[color:var(--brand-green)] text-white text-center py-3 font-display text-xl tracking-wider brutal-border">
            ✓ PALPITE SALVO
          </div>
        ) : (
          <button
            onClick={() => {
              setEditing(true);
              setA(prediction.predicted_a);
              setB(prediction.predicted_b);
            }}
            className="w-full mt-3 bg-[color:var(--brand-yellow)] text-black brutal-border brutal-shadow py-3 font-display text-xl tracking-wider transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            EDITAR PALPITE
          </button>
        )}
      </article>
    );
  }

  return (
    <article className="bg-white dark:bg-card brutal-border brutal-shadow p-4">
      <div className="text-center space-y-1">
        <p className="font-display text-2xl">{match.team_a} {flagA}</p>
        <p className="font-display text-lg text-black/40 dark:text-white/40">VS</p>
        <p className="font-display text-2xl">{flagB} {match.team_b}</p>
        <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60 mt-2">
          {formatMatchDate(match.match_date)}
        </p>
      </div>
      <div className="border-t border-black/10 dark:border-white/10 mt-3 pt-3 text-center">
        {hasPrediction && (
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60">
            SEU PALPITE
          </p>
        )}
        <div className="flex items-end justify-center gap-2 mt-2">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60 leading-none">{getAbbr(match.team_a)}</span>
            <ScoreInput value={a} onChange={setA} ariaLabel={`Gols ${match.team_a}`} />
          </div>
          <span className="font-display text-3xl leading-none pb-2">×</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/60 dark:text-white/60 leading-none">{getAbbr(match.team_b)}</span>
            <ScoreInput value={b} onChange={setB} ariaLabel={`Gols ${match.team_b}`} />
          </div>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || a === "" || b === ""}
        className="w-full mt-3 bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow py-3 font-display text-xl tracking-wider transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
      >
        {saving ? "Salvando..." : hasPrediction ? "SALVAR" : "SALVAR PALPITE"}
      </button>
    </article>
  );
}

function ResultBlock({
  match,
  prediction,
}: {
  match: MatchRow;
  prediction: PredictionRow | undefined;
}) {
  const hasPrediction = prediction != null;
  const isCorrect = prediction?.is_correct ?? false;
  const points = prediction?.points_earned ?? 0;
  const flagA = getFlag(match.team_a);
  const flagB = getFlag(match.team_b);

  return (
    <article
      className={`brutal-border p-4 ${
        isCorrect
          ? "bg-[color:var(--brand-green)] text-white"
          : "bg-white dark:bg-card text-black dark:text-white"
      }`}
    >
      <div className="text-center space-y-1">
        <p className="font-display text-3xl">
          {match.team_a} {flagA} {match.result_a} × {match.result_b} {flagB}{" "}
          {match.team_b}
        </p>
        <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">
          {formatMatchDate(match.match_date)}
        </p>
      </div>
      {hasPrediction && (
        <>
          <div className="border-t border-black/10 dark:border-white/10 mt-3 pt-3 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">
              SEU PALPITE
            </p>
            <p
              className={`font-display text-3xl mt-1 ${
                isCorrect ? "text-white" : ""
              }`}
            >
              {prediction.predicted_a} × {prediction.predicted_b}
            </p>
          </div>
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
              {isCorrect ? `+${points}` : "+0"} PTS
            </span>
          </div>
        </>
      )}
    </article>
  );
}
