import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
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
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 px-8 py-14 text-center transition-all cursor-pointer hover:border-primary hover:bg-card/70",
        hover && "border-primary bg-card/70 glow",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        {busy ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Upload className="h-6 w-6 text-primary" />
        )}
      </div>
      <div>
        <p className="text-base font-semibold">Drop a CSV or Excel file</p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse · .csv .tsv .xlsx .xls</p>
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
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Parsed locally — your data never leaves the browser unless you ask AI a question.
      </div>
    </label>
  );
}
