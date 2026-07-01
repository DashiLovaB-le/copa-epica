import { useLastSync } from "@/lib/use-last-sync";

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `há ${h}h${m > 0 ? m + "min" : ""}`;
}

export function LastSyncText() {
  const { data: syncedAt } = useLastSync();
  if (!syncedAt) return null;
  return (
    <p className="text-white font-display text-[10px] whitespace-nowrap">
      🔄 Última atualização: {formatTimeAgo(syncedAt)}
    </p>
  );
}
