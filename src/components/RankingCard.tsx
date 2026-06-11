type Props = {
  rank: number;
  name: string;
  points: number;
  correct: number;
  isMe?: boolean;
};

export function RankingCard({ rank, name, points, correct, isMe }: Props) {
  return (
    <div
      className={`flex items-center gap-4 brutal-border p-3 ${
        isMe ? "bg-[color:var(--brand-yellow)]" : "bg-white"
      }`}
    >
      <div className="w-12 h-12 brutal-border bg-[color:var(--brand-blue)] text-white flex items-center justify-center font-display text-2xl">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold uppercase truncate">{name}</p>
        <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
          {correct} acertos
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-3xl leading-none">{points}</p>
        <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">pts</p>
      </div>
    </div>
  );
}

export function PodiumCard({
  position,
  name,
  points,
}: {
  position: 1 | 2 | 3;
  name: string;
  points: number;
}) {
  const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
  const colors = {
    1: "bg-[color:var(--brand-yellow)] text-black",
    2: "bg-white text-black",
    3: "bg-[color:var(--brand-green)] text-white",
  };
  const labels = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div className="flex flex-col items-center flex-1">
      <p className="font-bold uppercase text-xs mb-1 truncate max-w-full">{name}</p>
      <p className="font-display text-2xl leading-none mb-1">{points}</p>
      <div
        className={`${heights[position]} ${colors[position]} w-full brutal-border flex items-start justify-center pt-2 text-3xl`}
      >
        {labels[position]}
      </div>
    </div>
  );
}
