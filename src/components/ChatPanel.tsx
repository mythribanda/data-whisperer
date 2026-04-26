import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askDataset } from "@/utils/ai.functions";
import type { DatasetProfile } from "@/lib/profiler";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string }

export function ChatPanel({
  profile, persona, suggestions,
}: { profile: DatasetProfile; persona: string; suggestions: string[] }) {
  const ask = useServerFn(askDataset);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await ask({ data: { profile, question: q, persona, history: messages, mode: "chat" } });
      if (res.error) { toast.error(res.error); setMessages([...next, { role: "assistant", content: `_${res.error}_` }]); }
      else setMessages([...next, { role: "assistant", content: res.content || "_(empty)_" }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="surface-card flex h-[520px] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Ask your data</h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          persona · {persona}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages.length && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try a suggested question:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={
              m.role === "user"
                ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 px-3 py-2 text-sm text-foreground"
                : "max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2 text-sm"
            }>
              <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Analyzing…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this dataset…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" /> Ask
        </button>
      </form>
    </div>
  );
}
