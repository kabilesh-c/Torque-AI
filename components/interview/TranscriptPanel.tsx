"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TranscriptEntry } from "@/hooks/use-vapi";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  className?: string;
}

export function TranscriptPanel({ entries, className }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <p className="text-xs text-[var(--text-muted)] italic">
          Transcript will appear here during the interview...
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-y-auto space-y-3 px-1", className)}>
      {entries.map((entry, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2 animate-slide-up",
            entry.role === "assistant" ? "flex-row" : "flex-row-reverse"
          )}
        >
          {/* Avatar dot */}
          <div
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full mt-0.5 flex items-center justify-center text-[9px] font-bold",
              entry.role === "assistant"
                ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(14,165,233,0.3)]"
                : "bg-[var(--accent-dim)] text-[var(--accent)] border border-[rgba(232,255,0,0.3)]"
            )}
          >
            {entry.role === "assistant" ? "AI" : "U"}
          </div>

          {/* Bubble */}
          <div
            className={cn(
              "max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed",
              entry.role === "assistant"
                ? "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
                : "bg-[rgba(232,255,0,0.05)] text-[var(--text-primary)] border border-[rgba(232,255,0,0.1)]"
            )}
          >
            {entry.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
