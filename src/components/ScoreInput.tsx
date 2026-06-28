export function ScoreInput({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      disabled={disabled}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (raw === "") return onChange("");
        const n = Math.min(99, parseInt(raw, 10));
        onChange(n);
      }}
      className="w-16 h-16 text-center font-display text-4xl brutal-border bg-white text-black focus:outline-none focus:bg-[color:var(--brand-yellow)] disabled:bg-neutral-200 disabled:text-neutral-500"
    />
  );
}
