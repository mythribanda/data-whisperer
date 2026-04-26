import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Activity, AlertTriangle, BarChart3, Brain, Database, Download, FileWarning,
  Lightbulb, ListChecks, MessageSquare, Sparkles, Wand2, GitCompareArrows,
} from "lucide-react";
import { FileDrop } from "@/components/FileDrop";
import { MetricCard } from "@/components/MetricCard";
import { TrustGauge } from "@/components/TrustGauge";
import { AutoCharts } from "@/components/AutoCharts";
import { ChatPanel } from "@/components/ChatPanel";
import { parseFile } from "@/lib/parseFile";
import { profileDataset, generateInsights, trendForecast, type DatasetProfile } from "@/lib/profiler";
import { exportReportPDF } from "@/lib/exportReport";
import { askDataset } from "@/utils/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Dataset Intelligence Engine" },
      { name: "description", content: "Upload a CSV or Excel file and get an analyst-grade intelligence report: profiling, trust score, risks, insights, and an Ask-Your-Data chat." },
      { property: "og:title", content: "AI Dataset Intelligence Engine" },
      { property: "og:description", content: "Turn raw datasets into decision intelligence — trust score, risks, contradictions, insights, and chat." },
    ],
  }),
  component: Home,
});

type Persona = "business" | "student" | "developer";
type Tab = "overview" | "charts" | "insights" | "trust" | "chat" | "report";

function Home() {
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [persona, setPersona] = useState<Persona>("business");
  const [narrative, setNarrative] = useState<string>("");
  const [story, setStory] = useState<string>("");
  const [aiBusy, setAiBusy] = useState<"narrative" | "story" | null>(null);
  const ask = useServerFn(askDataset);

  const insights = useMemo(() => (profile ? generateInsights(profile) : []), [profile]);
  const forecast = useMemo(() => (profile ? trendForecast(profile) : null), [profile]);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const parsed = await parseFile(file);
      if (!parsed.rows.length) { toast.error("File has no rows."); return; }
      const p = profileDataset(parsed.rows, parsed.headers);
      setProfile(p); setRows(parsed.rows); setFileName(parsed.fileName); setTab("overview");
      setNarrative(""); setStory("");
      toast.success(`Profiled ${parsed.rows.length} rows × ${parsed.headers.length} columns`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse file");
    } finally { setBusy(false); }
  };

  const runAi = async (mode: "narrative" | "story") => {
    if (!profile) return;
    setAiBusy(mode);
    try {
      const slim = { ...profile, preview: profile.preview.slice(0, 3) };
      const res = await ask({ data: { profile: slim, question: "", persona, mode } });
      if (res.error) toast.error(res.error);
      else if (mode === "narrative") setNarrative(res.content || "");
      else setStory(res.content || "");
    } finally { setAiBusy(null); }
  };

  const tabs: { id: Tab; label: string; icon: typeof Database }[] = [
    { id: "overview", label: "Overview", icon: Database },
    { id: "charts", label: "Visualizations", icon: BarChart3 },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "trust", label: "Trust & Risk", icon: AlertTriangle },
    { id: "chat", label: "Ask your data", icon: MessageSquare },
    { id: "report", label: "Report", icon: Download },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                AI Dataset <span className="text-gradient">Intelligence Engine</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">Upload → Profile → Decide</p>
            </div>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">persona</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as Persona)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                <option value="business">Business</option>
                <option value="student">Student</option>
                <option value="developer">Developer</option>
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!profile ? (
          <section className="relative">
            <div className="absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
            <div className="mx-auto max-w-3xl py-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> analyst-grade · explainable
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                Turn raw data into <span className="text-gradient">decisions</span>.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
                Drop a CSV or Excel file. Get a trust score, behavior narrative, automated visualizations
                with reasoning, risks, contradictions, suggested questions, and a chat that knows your data.
              </p>
            </div>
            <div className="mx-auto max-w-2xl">
              <FileDrop onFile={handleFile} busy={busy} />
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-3">
              {[
                { i: Activity, t: "Profiling Engine", d: "Types, missingness, duplicates, outliers, cardinality." },
                { i: AlertTriangle, t: "Trust & Risk", d: "Weighted score plus contradictions and human-error signals." },
                { i: Wand2, t: "AI Reasoning", d: "Narrative, persona-aware insights, data story, chat." },
              ].map(({ i: Icon, t, d }) => (
                <div key={t} className="surface-card p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="mt-2 text-sm font-semibold">{t}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">active dataset</div>
                <div className="truncate text-lg font-semibold">{fileName}</div>
              </div>
              <button
                onClick={() => { setProfile(null); setRows([]); setFileName(""); }}
                className="rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-xs hover:border-primary"
              >
                Upload new
              </button>
            </div>

            <nav className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card/40 p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </nav>

            {tab === "overview" && <Overview profile={profile} forecast={forecast} narrative={narrative} runNarrative={() => runAi("narrative")} aiBusy={aiBusy === "narrative"} />}
            {tab === "charts" && <AutoCharts profile={profile} rows={rows} />}
            {tab === "insights" && <Insights insights={insights} profile={profile} />}
            {tab === "trust" && <TrustRisk profile={profile} />}
            {tab === "chat" && <ChatPanel profile={profile} persona={persona} suggestions={profile.suggestedQuestions} />}
            {tab === "report" && (
              <ReportTab
                profile={profile}
                fileName={fileName}
                insights={insights}
                narrative={narrative}
                story={story}
                runStory={() => runAi("story")}
                aiBusy={aiBusy === "story"}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-[11px] text-muted-foreground">
        Built with Lovable · Recharts · Lovable AI
      </footer>
    </div>
  );
}

function Overview({
  profile, forecast, narrative, runNarrative, aiBusy,
}: { profile: DatasetProfile; forecast: string | null; narrative: string; runNarrative: () => void; aiBusy: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Rows" value={profile.rowCount.toLocaleString()} accent="primary" />
        <MetricCard label="Columns" value={profile.colCount} accent="primary" />
        <MetricCard
          label="Missing cells"
          value={`${profile.missingPct.toFixed(1)}%`}
          hint={`${profile.missingCells.toLocaleString()} cells`}
          accent={profile.missingPct > 10 ? "warning" : "success"}
        />
        <MetricCard
          label="Duplicate rows"
          value={profile.duplicateRows}
          accent={profile.duplicateRows ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TrustGauge score={profile.trustScore} />
        <div className="surface-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Behavior narrative</h3>
            <button
              onClick={runNarrative}
              disabled={aiBusy}
              className="rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs hover:border-primary disabled:opacity-40"
            >
              {aiBusy ? "Thinking…" : narrative ? "Regenerate" : "Generate with AI"}
            </button>
          </div>
          {narrative ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{narrative}</ReactMarkdown>
            </div>
          ) : (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {profile.behavior.map((b) => <li key={b}>• {b}</li>)}
            </ul>
          )}
          {forecast && (
            <div className="mt-3 rounded-md border border-border bg-background/40 p-3 text-xs">
              <div className="mb-1 font-mono uppercase tracking-wider text-primary">trend forecast</div>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{forecast}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      <ColumnTable profile={profile} />
      <PreviewTable profile={profile} />
    </div>
  );
}

function ColumnTable({ profile }: { profile: DatasetProfile }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold">Column profile</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr>
              {["Column", "Type", "Missing %", "Unique", "Min", "Max", "Mean", "Notes"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.columns.map((c) => (
              <tr key={c.name} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2"><TypePill type={c.type} /></td>
                <td className="px-3 py-2 tabular-nums">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-[color:var(--color-warning)]" style={{ width: `${Math.min(100, c.missingPct)}%` }} />
                    </div>
                    {c.missingPct.toFixed(1)}%
                  </div>
                </td>
                <td className="px-3 py-2 tabular-nums">{c.unique}</td>
                <td className="px-3 py-2 tabular-nums">{c.min !== undefined ? c.min.toFixed(2) : "—"}</td>
                <td className="px-3 py-2 tabular-nums">{c.max !== undefined ? c.max.toFixed(2) : "—"}</td>
                <td className="px-3 py-2 tabular-nums">{c.mean !== undefined ? c.mean.toFixed(2) : "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.constant && <span className="mr-1 rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">constant</span>}
                  {c.highCardinality && <span className="mr-1 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">high-card</span>}
                  {(c.outliers ?? 0) > 0 && <span className="mr-1 rounded bg-[color:var(--color-warning)]/20 px-1.5 py-0.5 text-[10px] text-[color:var(--color-warning)]">{c.outliers} outliers</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TypePill({ type }: { type: string }) {
  const map: Record<string, string> = {
    numeric: "bg-primary/15 text-primary",
    categorical: "bg-accent/15 text-accent",
    datetime: "bg-[color:var(--color-info)]/15 text-[color:var(--color-info)]",
    boolean: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
    text: "bg-secondary text-muted-foreground",
    id: "bg-secondary text-muted-foreground",
  };
  return <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-mono", map[type])}>{type}</span>;
}

function PreviewTable({ profile }: { profile: DatasetProfile }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold">Preview · first {profile.preview.length} rows</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr>
              {profile.headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.preview.map((r, i) => (
              <tr key={i} className="border-t border-border/60">
                {profile.headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-3 py-1.5">{String(r[h] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Insights({
  insights, profile,
}: { insights: { text: string; confidence: number; tag: string }[]; profile: DatasetProfile }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="surface-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-primary" /> Key findings</h3>
        <ul className="space-y-3">
          {insights.map((i, idx) => (
            <li key={idx} className="flex gap-3">
              <div className="mt-0.5 flex h-6 min-w-[2.5rem] items-center justify-center rounded bg-primary/15 font-mono text-[10px] text-primary">
                {(i.confidence * 100).toFixed(0)}%
              </div>
              <div className="flex-1">
                <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{i.tag}</span>
                <span className="text-sm">
                  <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                    {i.text}
                  </ReactMarkdown>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="surface-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-primary" /> Suggested questions</h3>
        <ul className="space-y-2">
          {profile.suggestedQuestions.map((q) => (
            <li key={q} className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm">{q}</li>
          ))}
        </ul>
      </div>
      <div className="surface-card p-4 lg:col-span-2">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4 text-primary" /> Recommended actions</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {profile.recommendedActions.map((a) => (
            <div key={a} className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm">→ {a}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustRisk({ profile }: { profile: DatasetProfile }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="surface-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" /> Trust breakdown</h3>
        <div className="space-y-3">
          {profile.trustBreakdown.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">{b.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{b.score.toFixed(0)} · w{(b.weight * 100).toFixed(0)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${b.score}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{b.note}</div>
            </div>
          ))}
        </div>
      </div>
      <RiskList title="Risks" icon={AlertTriangle} items={profile.risks} empty="No major risks detected." />
      <RiskList title="Contradictions" icon={GitCompareArrows} items={profile.contradictions} empty="No internal contradictions detected." />
      <RiskList title="Human-error signals" icon={FileWarning} items={profile.humanErrors} empty="No suspicious values detected." className="lg:col-span-3" />
    </div>
  );
}

function RiskList({
  title, icon: Icon, items, empty, className,
}: { title: string; icon: typeof AlertTriangle; items: string[]; empty: string; className?: string }) {
  return (
    <div className={cn("surface-card p-4", className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-[color:var(--color-warning)]" /> {title}</h3>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((r) => <li key={r} className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm">⚠ {r}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function ReportTab({
  profile, fileName, insights, narrative, story, runStory, aiBusy,
}: {
  profile: DatasetProfile; fileName: string; insights: { text: string; confidence: number; tag: string }[];
  narrative: string; story: string; runStory: () => void; aiBusy: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Data Story (AI-generated)</h3>
          <button
            onClick={runStory}
            disabled={aiBusy}
            className="rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs hover:border-primary disabled:opacity-40"
          >
            {aiBusy ? "Composing…" : story ? "Regenerate" : "Generate Data Story"}
          </button>
        </div>
        {story ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{story}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Click "Generate Data Story" to compose a presentation-ready summary with title, key insights, risks, and actions.</p>
        )}
      </div>

      <div className="surface-card flex items-center justify-between p-4">
        <div>
          <h3 className="text-sm font-semibold">Export full PDF report</h3>
          <p className="text-xs text-muted-foreground">Includes overview, narrative, insights, risks, contradictions, recommendations, column profile, and the data story.</p>
        </div>
        <button
          onClick={() => exportReportPDF({ profile, fileName, insights, story, narrative })}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>
    </div>
  );
}
