"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const INTERVIEW_TYPES = [
  {
    id: "BEHAVIORAL",
    emoji: "🧠",
    label: "Behavioral",
    tagline: "Tell me about a time…",
    desc: "Conflict resolution, leadership, failure, collaboration. The AI evaluates STAR completeness and pushes on vague answers.",
    topics: ["Conflict resolution", "Handling failure", "Leadership", "Prioritization"],
    recommended: true,
    color: "var(--accent)",
    colorDim: "var(--accent-dim)",
    borderActive: "rgba(232,255,0,0.4)",
  },
  {
    id: "TECHNICAL",
    emoji: "💻",
    label: "Technical",
    tagline: "Walk me through your approach…",
    desc: "Data structures, algorithms, debugging. Peer-level screen that probes edge cases and scalability.",
    topics: ["Algorithms", "Optimization", "Debugging", "Trade-offs"],
    recommended: false,
    color: "var(--accent-blue)",
    colorDim: "var(--accent-blue-dim)",
    borderActive: "rgba(14,165,233,0.4)",
  },
  {
    id: "SYSTEM_DESIGN",
    emoji: "🏗️",
    label: "System Design",
    tagline: "Design a system that…",
    desc: "Staff engineer style. Rewards clarifying questions, penalizes jumping to solutions without tradeoff discussion.",
    topics: ["Architecture", "Scalability", "Reliability", "Trade-offs"],
    recommended: false,
    color: "#a78bfa",
    colorDim: "rgba(167,139,250,0.1)",
    borderActive: "rgba(167,139,250,0.4)",
  },
  {
    id: "HR_CULTURE",
    emoji: "🤝",
    label: "HR / Culture Fit",
    tagline: "What motivates you most…",
    desc: "Values, motivations, situational judgment. Uses 'what if' follow-up twists to stress-test your answers.",
    topics: ["Motivations", "Working style", "Values", "Judgment"],
    recommended: false,
    color: "var(--accent-green)",
    colorDim: "var(--accent-green-dim)",
    borderActive: "rgba(34,197,94,0.4)",
  },
];

export default function NewInterviewPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>("BEHAVIORAL");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewType: selected }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push(`/interview/${data.sessionId}`);
    } else {
      alert(data.error || "Failed to start interview");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-geist)" }}>Torque AI</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <LayoutDashboard size={14} /> Dashboard
          </Button>
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.04em" }}>
            Choose your interview
          </h1>
          <p className="text-[var(--text-secondary)]">
            Start with Behavioral — it&apos;s fully built and the most widely used. Other modes share the same AI engine.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {INTERVIEW_TYPES.map((type, i) => {
            const isSelected = selected === type.id;
            return (
              <button
                key={type.id}
                id={`interview-type-${type.id.toLowerCase()}`}
                onClick={() => setSelected(type.id)}
                className="relative text-left p-6 rounded-[var(--radius-xl)] border transition-all duration-300 animate-slide-up group"
                style={{
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: "both",
                  opacity: 0,
                  borderColor: isSelected ? type.borderActive : "var(--border)",
                  background: isSelected ? type.colorDim : "var(--surface)",
                  boxShadow: isSelected ? `0 0 30px ${type.colorDim}` : "none",
                }}
              >
                {/* Recommended badge */}
                {type.recommended && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="accent" size="sm">Recommended</Badge>
                  </div>
                )}

                {/* Emoji + label */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: isSelected ? `${type.color}20` : "var(--surface-elevated)", border: `1px solid ${isSelected ? type.borderActive : "var(--border)"}` }}
                  >
                    {type.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] mb-0.5" style={{ fontFamily: "var(--font-geist)" }}>
                      {type.label}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] italic">{type.tagline}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{type.desc}</p>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5">
                  {type.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md border"
                      style={{
                        borderColor: isSelected ? type.borderActive : "var(--border-subtle)",
                        color: isSelected ? type.color : "var(--text-muted)",
                        background: isSelected ? `${type.color}10` : "transparent",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Selection indicator */}
                <div
                  className="absolute bottom-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                  style={{
                    borderColor: isSelected ? type.color : "var(--border-strong)",
                    background: isSelected ? type.color : "transparent",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke={type.id === "BEHAVIORAL" ? "#000" : "#fff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Start button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleStart}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!selected}
            id="start-interview-btn"
            className="gap-2"
          >
            {!loading && <>Start {INTERVIEW_TYPES.find(t => t.id === selected)?.label} interview <ArrowRight size={16} /></>}
          </Button>
          {selected && (
            <p className="text-xs text-[var(--text-muted)]">
              ~15 minutes · Voice only · Mic required
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
