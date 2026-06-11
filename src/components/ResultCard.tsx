import { formatDateTime } from "@/lib/format";

type Props = {
  teamA: string;
  teamB: string;
  resultA: number;
  resultB: number;
  matchDate: string;
  predictedA?: number | null;
  predictedB?: number | null;
  pointsEarned?: number | null;
};

export function ResultCard({
  teamA,
  teamB,
  resultA,
  resultB,
  matchDate,
  predictedA,
  predictedB,
  pointsEarned,
}: Props) {
  const hasPrediction = predictedA != null && predictedB != null;
  const isCorrect = (pointsEarned ?? 0) > 0;

  return (
    <article
      className={`brutal-border p-4 space-y-2 ${
        isCorrect ? "bg-[color:var(--brand-green)] text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest opacity-80">
        <span>{formatDateTime(matchDate)}</span>
        {hasPrediction && (
          <span
            className={`px-2 py-1 brutal-border ${
              isCorrect ? "bg-[color:var(--brand-yellow)] text-black" : "bg-black text-white"
            }`}
          >
            {pointsEarned ?? 0} PTS
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="flex-1 text-right font-display text-xl uppercase truncate">{teamA}</p>
        <p className="font-display text-4xl">
          {resultA} <span className="opacity-60">×</span> {resultB}
        </p>
        <p className="flex-1 text-left font-display text-xl uppercase truncate">{teamB}</p>
      </div>

      {hasPrediction && (
        <p className="text-[11px] uppercase font-bold tracking-widest text-center pt-1">
          Seu palpite: {predictedA} × {predictedB}
        </p>
      )}
    </article>
  );
}
