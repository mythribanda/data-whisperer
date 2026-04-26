import { cn } from "@/lib/utils";

export function MetricCard({
  label, value, hint, accent, className,
}: {
  label: string; value: React.ReactNode; hint?: string;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const accentColor: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-[color:var(--color-success)]",
    warning: "text-[color:var(--color-warning)]",
    destructive: "text-destructive",
  };
  return (
    <div className={cn("surface-card p-4", className)}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", accent && accentColor[accent])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
