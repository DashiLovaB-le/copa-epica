import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="bg-brand-blue-gradient text-white brutal-border border-x-0 border-t-0 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display tracking-wider leading-none">{title}</h1>
          {subtitle && (
            <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
