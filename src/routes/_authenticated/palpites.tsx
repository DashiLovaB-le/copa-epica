import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreInput } from "@/components/ScoreInput";
import { formatMatchDate, formatCountdown } from "@/lib/format";
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

function getFlag(name: string): string {
  return COUNTRY_FLAGS[name] ?? "";
}

type Filter = "todos" | "hoje" | "em-breve" | "encerrados";

async function fetchData(userId: string) {
  const [matches, preds, profileResult, allProfiles] = await Promise.all([
    supabase
      .from("copaepica_matches")
      .select("*")
      .order("match_date", { ascending: true }),
    supabase
      .from("copaepica_predictions")
      .select("match_id,predicted_a,predicted_b,points_earned,is_correct")
      .eq("user_id", userId),
    supabase
      .from("copaepica_profiles")
      .select("id,display_name,points,correct_guesses")
      .eq("id", userId)
      .single(),
    supabase
      .from("copaepica_profiles")
      .select("id")
      .order("points", { ascending: false })
      .order("correct_guesses", { ascending: false }),
  ]);
  if (matches.error) throw matches.error;
  if (preds.error) throw preds.error;
  if (profileResult.error) throw profileResult.error;
  if (allProfiles.error) throw allProfiles.error;

  const profile = profileResult.data as ProfileRow;
  const rank = (allProfiles.data ?? []).findIndex((p) => p.id === userId) + 1;

  return {
    matches: (matches.data ?? []) as MatchRow[],
    preds: (preds.data ?? []) as PredictionRow[],
    profile,
    rank: rank > 0 ? rank : null,
  };
}

function PalpitesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["palpites", user.id],
    queryFn: () => fetchData(user.id),
  });

  useEffect(() => {
    const ch = supabase
      .channel("palpites-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_matches" },
        () => qc.invalidateQueries({ queryKey: ["palpites"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_predictions" },
        () => qc.invalidateQueries({ queryKey: ["palpites"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "copaepica_profiles" },
        () => qc.invalidateQueries({ queryKey: ["palpites"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const now = useMemo(() => Date.now(), []);

  const availableMatches = useMemo(
    () => (data?.matches ?? []).filter((m) => m.result_a === null),
    [data],
  );
  const completedMatches = useMemo(
    () => (data?.matches ?? []).filter((m) => m.result_a !== null),
    [data],
  );

  const currentRound = useMemo(() => {
    if (availableMatches.length > 0) return availableMatches[0].round_number;
    if (completedMatches.length > 0) return completedMatches[completedMatches.length - 1].round_number;
    return 1;
  }, [availableMatches, completedMatches]);

  const nextMatchCountdown = useMemo(() => {
    const nextMatch = availableMatches.find(
      (m) => new Date(m.match_date).getTime() > now,
    );
    if (!nextMatch) return null;
    return formatCountdown(new Date(nextMatch.match_date).getTime() - now);
  }, [availableMatches, now]);

  const filteredMatches = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(), today.getMonth(), today.getDate(),
    ).getTime();
    const endOfToday = startOfToday + 86400000;

    return availableMatches.filter((m) => {
      const matchTime = new Date(m.match_date).getTime();
      switch (filter) {
        case "todos": return true;
        case "hoje": return matchTime >= startOfToday && matchTime < endOfToday;
        case "em-breve": return matchTime > now && matchTime <= endOfToday + 86400000;
        case "encerrados": return matchTime <= now;
      }
    });
  }, [availableMatches, filter, now]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-display text-3xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
        <h1 className="text-4xl font-display tracking-wider leading-none">BOLÃO DA COPA</h1>
        <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
          Palpites da Rodada {currentRound}
        </p>
      </header>

      <div className="bg-black text-white brutal-border border-x-0 border-t-0 p-4 flex items-center justify-between">
        {data?.rank ? (
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl">#{data.rank}º</span>
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
                : "bg-white text-black/60 hover:bg-neutral-100"
            }`}
          >
            {f === "em-breve" ? "EM BREVE" : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white brutal-border p-6 text-center">
            <p className="font-display text-2xl">Nenhum jogo disponível</p>
            <p className="text-sm mt-2 uppercase font-bold tracking-wider text-black/60">
              {filter === "encerrados"
                ? "Aguardando resultados..."
                : "Volte em breve para palpitar"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
              JOGOS DISPONÍVEIS
            </p>
            {filteredMatches.map((m) => (
              <GameCard
                key={m.id}
                match={m}
                prediction={
                  (data?.preds ?? []).find((x) => x.match_id === m.id)
                }
                started={new Date(m.match_date).getTime() <= now}
                onSave={(a, b) => savePrediction(m.id, a, b)}
              />
            ))}
          </>
        )}
      </div>

      {completedMatches.length > 0 && (
        <div className="px-4 mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-black" />
            <h2 className="font-display text-3xl whitespace-nowrap">
              ÚLTIMOS RESULTADOS
            </h2>
            <div className="flex-1 h-[3px] bg-black" />
          </div>
          <div className="space-y-3">
            {[...completedMatches]
              .sort(
                (a, b) =>
                  new Date(b.match_date).getTime() -
                  new Date(a.match_date).getTime(),
              )
              .slice(0, 10)
              .map((m) => (
                <ResultBlock
                  key={m.id}
                  match={m}
                  prediction={
                    (data?.preds ?? []).find((x) => x.match_id === m.id)
                  }
                />
              ))}
          </div>
        </div>
      )}
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

  const hasPrediction = prediction != null;
  const flagA = getFlag(match.team_a);
  const flagB = getFlag(match.team_b);

  async function handleSave() {
    if (a === "" || b === "") return;
    setSaving(true);
    try {
      await onSave(a, b);
      setJustSaved(true);
      setEditing(false);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (started) {
    return (
      <article className="bg-white brutal-border brutal-shadow p-4">
        <div className="text-center space-y-1">
          <p className="font-display text-2xl">{match.team_a} {flagA}</p>
          <p className="font-display text-lg text-black/40">VS</p>
          <p className="font-display text-2xl">{flagB} {match.team_b}</p>
          <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 mt-2">
            {formatMatchDate(match.match_date)}
          </p>
        </div>
        {hasPrediction && (
          <>
            <div className="border-t border-black/10 mt-3 pt-3 text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
                SEU PALPITE
              </p>
              <p className="font-display text-4xl mt-1">
                {prediction.predicted_a} × {prediction.predicted_b}
              </p>
            </div>
            <div className="mt-3 bg-neutral-200 text-neutral-700 text-center py-3 font-display text-xl tracking-wider brutal-border">
              PALPITE ENCERRADO
            </div>
          </>
        )}
      </article>
    );
  }

  if (!editing && hasPrediction) {
    return (
      <article className="bg-white brutal-border brutal-shadow-blue p-4">
        <div className="text-center space-y-1">
          <p className="font-display text-2xl">{match.team_a} {flagA}</p>
          <p className="font-display text-lg text-black/40">VS</p>
          <p className="font-display text-2xl">{flagB} {match.team_b}</p>
          <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 mt-2">
            {formatMatchDate(match.match_date)}
          </p>
        </div>
        <div className="border-t border-black/10 mt-3 pt-3 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
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
    <article className="bg-white brutal-border brutal-shadow p-4">
      <div className="text-center space-y-1">
        <p className="font-display text-2xl">{match.team_a} {flagA}</p>
        <p className="font-display text-lg text-black/40">VS</p>
        <p className="font-display text-2xl">{flagB} {match.team_b}</p>
        <p className="text-[11px] uppercase font-bold tracking-widest text-black/60 mt-2">
          {formatMatchDate(match.match_date)}
        </p>
      </div>
      <div className="border-t border-black/10 mt-3 pt-3 text-center">
        {hasPrediction && (
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
            SEU PALPITE
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <ScoreInput value={a} onChange={setA} ariaLabel={`Gols ${match.team_a}`} />
          <span className="font-display text-3xl">×</span>
          <ScoreInput value={b} onChange={setB} ariaLabel={`Gols ${match.team_b}`} />
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
          : "bg-white text-black"
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
          <div className="border-t border-black/10 mt-3 pt-3 text-center">
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
