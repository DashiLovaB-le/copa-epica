type Props = {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "white";
};

export function UserStatsCard({ label, value, color = "white" }: Props) {
  const colors = {
    blue: "bg-brand-blue-gradient text-white",
    green: "bg-[color:var(--brand-green)] text-white",
    yellow: "bg-[color:var(--brand-yellow)] text-black",
    white: "bg-white text-black",
  };
  return (
    <div className={`brutal-border p-4 ${colors[color]}`}>
      <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">{label}</p>
      <p className="font-display text-4xl leading-tight mt-1">{value}</p>
    </div>
  );
}
