export const PHASES = [
  { key: "Segunda Fase", label: "SEGUNDA FASE", emoji: "🌎" },
  { key: "Oitavas de final", label: "OITAVAS DE FINAL", emoji: "⚔️" },
  { key: "Quartas de final", label: "QUARTAS DE FINAL", emoji: "🔥" },
  { key: "Semifinais", label: "SEMIFINAIS", emoji: "🏅" },
  { key: "Disputa do 3º lugar", label: "DISPUTA DO 3º LUGAR", emoji: "🥉" },
  { key: "Grande Final", label: "GRANDE FINAL", emoji: "🏆" },
] as const;

export type Phase = (typeof PHASES)[number]["key"];

export const PHASE_ORDER: Phase[] = PHASES.map((p) => p.key as Phase);

export function getPhaseName(matchDate: string): Phase {
  const d = new Date(matchDate);
  const m = d.getMonth() + 1;
  const day = d.getDate();

  if (m === 7) {
    if (day >= 4 && day <= 7) return "Oitavas de final";
    if (day >= 9 && day <= 11) return "Quartas de final";
    if (day >= 14 && day <= 15) return "Semifinais";
    if (day === 18) return "Disputa do 3º lugar";
    if (day === 19) return "Grande Final";
  }

  return "Segunda Fase";
}

const PHASE_DATE_LABELS: Record<Phase, string> = {
  "Segunda Fase": "Até 3 de julho",
  "Oitavas de final": "4 a 7 de julho",
  "Quartas de final": "9 a 11 de julho",
  "Semifinais": "14 e 15 de julho",
  "Disputa do 3º lugar": "18 de julho",
  "Grande Final": "19 de julho — 16h",
};

export function getPhaseDateLabel(phase: Phase): string {
  return PHASE_DATE_LABELS[phase];
}

export function getPhaseInfo(phase: Phase) {
  return PHASES.find((p) => p.key === phase)!;
}
