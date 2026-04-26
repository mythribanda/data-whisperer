import { cn } from "@/lib/utils";

export function TrustGauge({ score }: { score: number }) {
  const tier = score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";
  const color = score >= 80 ? "var(--color-success)" : score >= 55 ? "var(--color-warning)" : "var(--color-destructive)";
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="surface-card flex items-center gap-5 p-5">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} stroke="var(--color-secondary)" strokeWidth="10" fill="none" />
          <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 600ms ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold tabular-nums">{score}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">/100</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Dataset Trust Score</div>
        <div className={cn("mt-1 text-2xl font-semibold")} style={{ color }}>{tier} trust</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Weighted blend of completeness, uniqueness, variance, stability, and structure.
        </p>
      </div>
    </div>
  );
}
