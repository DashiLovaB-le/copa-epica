import { useState } from "react";
import { ScoreInput } from "./ScoreInput";
import { formatDateTime } from "@/lib/format";

type Props = {
  matchId: string;
  teamA: string;
  teamB: string;
  matchDate: string;
  initialPredA?: number | null;
  initialPredB?: number | null;
  locked: boolean;
  onSave: (a: number, b: number) => Promise<void>;
};

export function MatchCard({
  teamA,
  teamB,
  matchDate,
  initialPredA,
  initialPredB,
  locked,
  onSave,
}: Props) {
  const [a, setA] = useState<number | "">(initialPredA ?? "");
  const [b, setB] = useState<number | "">(initialPredB ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasInitial = initialPredA != null && initialPredB != null;

  async function handleSave() {
    if (a === "" || b === "") return;
    setSaving(true);
    try {
      await onSave(a, b);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="bg-white dark:bg-card brutal-border brutal-shadow-blue p-4 space-y-3">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-black/70 dark:text-white/70">
        <span>{formatDateTime(matchDate)}</span>
        {locked ? (
          <span className="bg-black text-[color:var(--brand-yellow)] px-2 py-1">FECHADO</span>
        ) : hasInitial ? (
          <span className="bg-[color:var(--brand-green)] text-white px-2 py-1">PALPITE OK</span>
        ) : (
          <span className="bg-[color:var(--brand-yellow)] text-black px-2 py-1">EM ABERTO</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <p className="font-display text-2xl leading-none uppercase">{teamA}</p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreInput value={a} onChange={setA} disabled={locked} ariaLabel={`Gols ${teamA}`} />
          <span className="font-display text-3xl">×</span>
          <ScoreInput value={b} onChange={setB} disabled={locked} ariaLabel={`Gols ${teamB}`} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display text-2xl leading-none uppercase">{teamB}</p>
        </div>
      </div>

      {!locked && (
        <button
          onClick={handleSave}
          disabled={saving || a === "" || b === ""}
          className={`w-full brutal-border py-3 font-display text-xl tracking-wider transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
            saved
              ? "bg-[color:var(--brand-yellow)] text-black brutal-shadow"
              : "bg-[color:var(--brand-green)] text-white brutal-shadow"
          } disabled:opacity-50`}
        >
          {saving ? "Salvando..." : saved ? "✓ Salvo!" : hasInitial ? "Atualizar palpite" : "Salvar palpite"}
        </button>
      )}
    </article>
  );
}
