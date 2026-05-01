import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Bot, User, Trash2 } from "lucide-react";
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

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="surface-card flex h-[560px] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Ask your data</h3>
          <p className="text-[10px] text-muted-foreground">AI-powered Q&A about your dataset</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          persona · {persona}
        </span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {!messages.length && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-3 text-sm font-medium">What would you like to know?</p>
              <p className="mt-1 text-xs text-muted-foreground">Ask anything about your dataset — I have the full profile.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-secondary/40 px-3.5 py-2 text-xs text-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-105"
                >
                  <Sparkles className="mr-1.5 inline h-3 w-3 text-primary/60" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className="flex items-start gap-2.5 max-w-[88%]">
              {m.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={
                m.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 px-4 py-2.5 text-sm text-foreground"
                  : "rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/40 px-4 py-2.5 text-sm"
              }>
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
              {m.role === "user" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10">
                  <User className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-start gap-2.5">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/40 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary typing-dot" />
                <div className="h-2 w-2 rounded-full bg-primary typing-dot" />
                <div className="h-2 w-2 rounded-full bg-primary typing-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border/60 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this dataset…"
          className="flex-1 rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_0_20px_-4px_var(--color-primary)] transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
        >
          <Send className="h-3.5 w-3.5" /> Ask
        </button>
      </form>
    </div>
  );
}
