export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const MONTHS_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
];

export function formatMatchDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} • ${hours}:${mins}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const totalHours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    return `${days}d ${totalHours % 24}h`;
  }
  const h = totalHours.toString().padStart(2, '0');
  const m = mins.toString().padStart(2, '0');
  return `${h}h ${m}m`;
}
