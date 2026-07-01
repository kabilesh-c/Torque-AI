"use client";

import { cn } from "@/lib/utils";
import { ScoreBadge, InterviewTypeBadge, StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarDays, Clock, MessageSquare } from "lucide-react";

interface SessionCardProps {
  session: {
    id: string;
    interviewType: string;
    status: string;
    startedAt: string;
    endedAt?: string | null;
    report?: { overallScore: number } | null;
    _count?: { transcript: number };
  };
  index?: number;
}

export function SessionCard({ session, index = 0 }: SessionCardProps) {
  const startDate = new Date(session.startedAt);
  const duration =
    session.endedAt
      ? Math.round(
          (new Date(session.endedAt).getTime() - startDate.getTime()) / 60000
        )
      : null;

  return (
    <Link href={`/dashboard/${session.id}`}>
      <div
        className={cn(
          "group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-300",
          "hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
          "cursor-pointer animate-slide-up"
        )}
        style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both", opacity: 0 }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <InterviewTypeBadge type={session.interviewType} />
            <StatusBadge status={session.status} />
          </div>
          {session.report && <ScoreBadge score={session.report.overallScore} />}
        </div>

        {/* Score ring (if completed) */}
        {session.report && (
          <div className="mb-4">
            <div className="flex items-end gap-1">
              <span
                className="text-4xl font-bold"
                style={{
                  fontFamily: "var(--font-geist)",
                  background: `linear-gradient(135deg, var(--text-primary), var(--text-secondary))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {session.report.overallScore}
              </span>
              <span className="text-[var(--text-muted)] text-sm mb-1">/10</span>
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {duration !== null && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {duration}m
            </span>
          )}
          {session._count && (
            <span className="flex items-center gap-1">
              <MessageSquare size={11} />
              {Math.floor(session._count.transcript / 2)} exchanges
            </span>
          )}
        </div>

        {/* Hover arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[var(--text-muted)]">
          →
        </div>
      </div>
    </Link>
  );
}
