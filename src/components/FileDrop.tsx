import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDrop({ onFile, busy }: { onFile: (f: File) => void; busy?: boolean }) {
  const [hover, setHover] = useState(false);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHover(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300 cursor-pointer",
        "bg-card/30 backdrop-blur-sm border-border hover:border-primary/60 hover:bg-card/50",
        hover && "border-primary bg-primary/5 glow scale-[1.01]",
        busy && "pointer-events-none opacity-60",
      )}
    >
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className={cn(
        "relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
        hover ? "bg-primary/15 scale-110" : "bg-secondary",
      )}>
        {busy ? (
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Upload className={cn("h-7 w-7 transition-colors duration-300", hover ? "text-primary" : "text-primary/70")} />
        )}
      </div>
      <div className="relative">
        <p className="text-lg font-semibold">
          {busy ? "Analyzing your dataset…" : "Drop a CSV or Excel file"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {busy ? "Profiling columns, detecting types, computing trust score" : "or click to browse · .csv .tsv .xlsx .xls · up to 25MB"}
        </p>
      </div>
      <input
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="relative mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Parsed locally — your data never leaves the browser unless you ask AI a question.
      </div>
      {!busy && (
        <div className="relative mt-1 flex items-center gap-2 text-[11px] text-primary/60">
          <Sparkles className="h-3 w-3" />
          Instant profiling with trust score, risk analysis, and auto-generated insights
        </div>
      )}
    </label>
  );
}
