import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ColumnProfile, DatasetProfile } from "@/lib/profiler";

const PALETTE = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)",
];

function ChartShell({ title, why, children }: { title: string; why: string; children: React.ReactNode }) {
  return (
    <div className="surface-card flex flex-col p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">auto-selected</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-wider text-primary">why · </span>
        {why}
      </p>
      <div className="h-48 w-full">{children}</div>
    </div>
  );
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--color-popover)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      fontSize: 12,
    },
    cursor: { fill: "var(--color-secondary)", opacity: 0.4 },
  } as const;
}

function NumericHistogram({ col, rows }: { col: ColumnProfile; rows: Record<string, unknown>[] }) {
  const nums = rows
    .map((r) => Number(String(r[col.name] ?? "").replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  const min = col.min ?? Math.min(...nums);
  const max = col.max ?? Math.max(...nums);
  const bins = 12;
  const step = (max - min) / bins || 1;
  const data = Array.from({ length: bins }, (_, i) => ({
    bucket: (min + i * step).toFixed(1),
    count: 0,
  }));
  for (const n of nums) {
    const idx = Math.min(bins - 1, Math.floor((n - min) / step));
    data[idx].count++;
  }
  return (
    <ChartShell
      title={`Distribution of ${col.name}`}
      why={`'${col.name}' is numeric — a histogram reveals shape (skew=${(col.skew ?? 0).toFixed(2)}) and outlier presence.`}
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <Tooltip {...tooltipStyle()} />
          <Bar dataKey="count" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function CategoricalBar({ col }: { col: ColumnProfile }) {
  if (!col.topValues?.length) return null;
  const data = col.topValues.slice(0, 8);
  return (
    <ChartShell
      title={`Top categories in ${col.name}`}
      why={`'${col.name}' is categorical with ${col.unique} unique value(s) — a bar chart compares frequencies.`}
    >
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <YAxis dataKey="value" type="category" width={100}
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <Tooltip {...tooltipStyle()} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function TimeLine({ col, numCol, rows }: { col: ColumnProfile; numCol: ColumnProfile; rows: Record<string, unknown>[] }) {
  const points = rows
    .map((r) => {
      const d = new Date(String(r[col.name]));
      const v = Number(String(r[numCol.name] ?? "").replace(/,/g, ""));
      return { t: d.getTime(), date: d.toISOString().slice(0, 10), v };
    })
    .filter((p) => !isNaN(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
  if (points.length < 3) return null;
  const groups = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    const k = p.date.slice(0, 7);
    const g = groups.get(k) ?? { sum: 0, n: 0 };
    g.sum += p.v; g.n++; groups.set(k, g);
  }
  const data = [...groups.entries()].map(([date, g]) => ({ date, value: g.sum / g.n }));
  return (
    <ChartShell
      title={`${numCol.name} over ${col.name}`}
      why={`'${col.name}' is a date and '${numCol.name}' is numeric — a line chart reveals trends and seasonality.`}
    >
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <Tooltip {...tooltipStyle()} />
          <Line type="monotone" dataKey="value" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ScatterPair({ a, b, rows }: { a: ColumnProfile; b: ColumnProfile; rows: Record<string, unknown>[] }) {
  const data = rows
    .map((r) => ({
      x: Number(String(r[a.name] ?? "").replace(/,/g, "")),
      y: Number(String(r[b.name] ?? "").replace(/,/g, "")),
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .slice(0, 400);
  if (data.length < 5) return null;
  return (
    <ChartShell
      title={`${a.name} vs ${b.name}`}
      why={`Two numeric columns — a scatter plot exposes correlation, clusters, and outliers.`}
    >
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="x" name={a.name} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <YAxis dataKey="y" name={b.name} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
          <Tooltip {...tooltipStyle()} />
          <Scatter data={data} fill="var(--color-chart-2)" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function CorrelationHeatmap({ profile }: { profile: DatasetProfile }) {
  if (!profile.numericMatrix) return null;
  const { columns, matrix } = profile.numericMatrix;
  const cell = (v: number) => {
    const intensity = Math.min(1, Math.abs(v));
    const color = v >= 0
      ? `oklch(0.78 ${0.17 * intensity} 195 / ${0.15 + 0.85 * intensity})`
      : `oklch(0.66 ${0.22 * intensity} 305 / ${0.15 + 0.85 * intensity})`;
    return color;
  };
  return (
    <div className="surface-card p-4 lg:col-span-2">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold">Correlation matrix</h4>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">pearson</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-wider text-primary">why · </span>
        Quickly find which numeric columns move together (cyan = positive, violet = negative).
      </p>
      <div className="overflow-auto">
        <table className="text-[10px]">
          <thead>
            <tr>
              <th></th>
              {columns.map((c) => (
                <th key={c} className="px-1 py-1 text-left font-normal text-muted-foreground">
                  <div className="w-12 truncate" title={c}>{c}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((row, i) => (
              <tr key={row}>
                <td className="pr-2 text-right text-muted-foreground">
                  <div className="w-20 truncate" title={row}>{row}</div>
                </td>
                {columns.map((_, j) => (
                  <td key={j} className="p-0.5">
                    <div
                      className="flex h-9 w-12 items-center justify-center rounded text-[10px] font-mono tabular-nums text-foreground"
                      style={{ background: cell(matrix[i][j]) }}
                      title={`${matrix[i][j].toFixed(2)}`}
                    >
                      {matrix[i][j].toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AutoCharts({ profile, rows }: { profile: DatasetProfile; rows: Record<string, unknown>[] }) {
  const numeric = profile.columns.filter((c) => c.type === "numeric");
  const categorical = profile.columns.filter((c) => c.type === "categorical");
  const datetime = profile.columns.find((c) => c.type === "datetime");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {numeric.slice(0, 2).map((c) => <NumericHistogram key={c.name} col={c} rows={rows} />)}
      {categorical.slice(0, 2).map((c) => <CategoricalBar key={c.name} col={c} />)}
      {datetime && numeric[0] && <TimeLine col={datetime} numCol={numeric[0]} rows={rows} />}
      {numeric[0] && numeric[1] && <ScatterPair a={numeric[0]} b={numeric[1]} rows={rows} />}
      <CorrelationHeatmap profile={profile} />
    </div>
  );
}
