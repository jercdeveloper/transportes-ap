import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  info: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
} as const;

export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}
