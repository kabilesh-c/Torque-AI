import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "blue" | "green" | "red" | "muted";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  const variants = {
    default: "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]",
    accent: "bg-[var(--accent-dim)] text-[var(--accent)] border border-[rgba(232,255,0,0.2)]",
    blue: "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(14,165,233,0.2)]",
    green: "bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[rgba(34,197,94,0.2)]",
    red: "bg-[var(--destructive-dim)] text-[var(--destructive)] border border-[rgba(239,68,68,0.2)]",
    muted: "bg-transparent text-[var(--text-muted)] border border-[var(--border-subtle)]",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5 rounded-md",
    md: "text-sm px-3 py-1 rounded-lg",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  if (score >= 8) return <Badge variant="green">{score}/10</Badge>;
  if (score >= 6) return <Badge variant="accent">{score}/10</Badge>;
  if (score >= 4) return <Badge variant="blue">{score}/10</Badge>;
  return <Badge variant="red">{score}/10</Badge>;
}

export function InterviewTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    BEHAVIORAL: "Behavioral",
    TECHNICAL: "Technical",
    SYSTEM_DESIGN: "System Design",
    HR_CULTURE: "HR / Culture",
  };
  return <Badge variant="muted">{labels[type] || type}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") return <Badge variant="green">Completed</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="blue">In Progress</Badge>;
  return <Badge variant="muted">Abandoned</Badge>;
}
