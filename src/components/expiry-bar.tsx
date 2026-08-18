import { daysUntil } from "@/lib/dates";

const WINDOW_DAYS = 180;

export function ExpiryBar({
  label,
  date,
}: {
  label: string;
  date: string | null;
}) {
  if (!date) return null;

  const days = daysUntil(date);
  const pct = Math.max(0, Math.min(100, (days / WINDOW_DAYS) * 100));

  const barColor =
    days < 0 ? "bg-red-600" : days <= 30 ? "bg-red-500" : days <= 90 ? "bg-amber-500" : "bg-emerald-500";
  const textColor =
    days < 0 || days <= 30 ? "text-red-600" : days <= 90 ? "text-amber-600" : "text-muted-foreground";
  const statusText =
    days < 0 ? `Vencido hace ${Math.abs(days)} días` : `Vence en ${days} días`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className={textColor}>{statusText}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
