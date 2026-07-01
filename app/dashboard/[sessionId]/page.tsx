"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InterviewTypeBadge, StatusBadge } from "@/components/ui/badge";
import { Zap, ArrowLeft, CheckCircle2, XCircle, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";

interface Turn { speaker: string; text: string; timestamp: string; }
interface StarAnalysis { situation: boolean; task: boolean; action: boolean; result: boolean; notes: string; }
interface Report {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  starAnalysis?: StarAnalysis;
  summary: string;
}
interface Session {
  id: string;
  interviewType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  transcript: Turn[];
  report?: Report;
}

export default function SessionReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d) => { setSession(d.session); setLoading(false); });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const report = session.report;
  const duration = session.endedAt
    ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : null;

  const aiTurns = session.transcript.filter((t) => t.speaker === "AI");
  const candidateTurns = session.transcript.filter((t) => t.speaker === "CANDIDATE");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
          </Link>
          <span className="text-[var(--border-strong)]">/</span>
          <Link href="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1.5">
            <LayoutDashboard size={13} /> Dashboard
          </Link>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-sm text-[var(--text-secondary)]">Report</span>
        </div>
        <Link href="/interview/new">
          <Button variant="primary" size="sm">New interview</Button>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors animate-fade-in">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <InterviewTypeBadge type={session.interviewType} />
            <StatusBadge status={session.status} />
            {duration && (
              <span className="text-xs text-[var(--text-muted)]">{duration} min</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.035em" }}>
            Interview Report
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {new Date(session.startedAt).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>

        {/* No report yet */}
        {!report && (
          <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] text-center">
            <div className="text-3xl mb-3">⏳</div>
            <p className="text-sm text-[var(--text-secondary)]">
              Report is being generated. Refresh in a few seconds.
            </p>
          </div>
        )}

        {report && (
          <>
            {/* Score + Summary */}
            <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] animate-slide-up" style={{ animationDelay: "60ms", animationFillMode: "both", opacity: 0 }}>
              <div className="flex items-start gap-6">
                {/* Animated score ring */}
                <ScoreRing score={report.overallScore} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Overall Assessment</div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.summary}</p>
                </div>
              </div>
            </div>

            {/* Strengths + Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}>
              <FeedbackList title="Strengths" items={report.strengths as string[]} type="strength" />
              <FeedbackList title="Areas to improve" items={report.weaknesses as string[]} type="weakness" />
            </div>

            {/* STAR Analysis (Behavioral only) */}
            {report.starAnalysis && (
              <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] animate-slide-up" style={{ animationDelay: "180ms", animationFillMode: "both", opacity: 0 }}>
                <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4">STAR Framework Coverage</div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(["situation", "task", "action", "result"] as const).map((key) => {
                    const covered = report.starAnalysis![key];
                    return (
                      <div key={key} className={`flex items-center gap-2.5 p-3 rounded-[var(--radius)] border ${covered ? "border-[rgba(34,197,94,0.2)] bg-[var(--accent-green-dim)]" : "border-[rgba(239,68,68,0.2)] bg-[var(--destructive-dim)]"}`}>
                        {covered
                          ? <CheckCircle2 size={14} className="text-[var(--accent-green)] flex-shrink-0" />
                          : <XCircle size={14} className="text-[var(--destructive)] flex-shrink-0" />}
                        <span className="text-sm font-medium capitalize" style={{ fontFamily: "var(--font-geist)" }}>
                          {key}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {report.starAnalysis.notes && (
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{report.starAnalysis.notes}</p>
                )}
              </div>
            )}

            {/* Session stats */}
            <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both", opacity: 0 }}>
              <MiniStat label="AI turns" value={aiTurns.length.toString()} />
              <MiniStat label="Your answers" value={candidateTurns.length.toString()} />
              <MiniStat label="Duration" value={duration ? `${duration}m` : "—"} />
            </div>

            {/* Full Transcript */}
            <div className="border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
                id="transcript-toggle"
              >
                <div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>Full Transcript</span>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{session.transcript.length} turns</span>
                </div>
                {showTranscript ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
              </button>

              {showTranscript && (
                <div className="divide-y divide-[var(--border)]">
                  {session.transcript.map((turn, i) => (
                    <div key={i} className={`px-6 py-4 flex gap-3 ${turn.speaker === "AI" ? "" : "bg-[rgba(232,255,0,0.01)]"}`}>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 ${turn.speaker === "AI" ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(14,165,233,0.2)]" : "bg-[var(--accent-dim)] text-[var(--accent)] border border-[rgba(232,255,0,0.2)]"}`}>
                        {turn.speaker === "AI" ? "AI" : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {turn.speaker === "AI" ? "Interviewer" : "You"}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] opacity-60">
                            {new Date(turn.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{turn.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = score >= 8 ? "var(--accent-green)" : score >= 6 ? "var(--accent)" : score >= 4 ? "var(--accent-blue)" : "var(--destructive)";

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={radius} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={44} cy={44} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-geist)", color }}>{score}</span>
        <span className="text-[10px] text-[var(--text-muted)]">/10</span>
      </div>
    </div>
  );
}

function FeedbackList({ title, items, type }: { title: string; items: string[]; type: "strength" | "weakness" }) {
  return (
    <div className="p-5 rounded-[var(--radius-xl)] border bg-[var(--surface)]"
      style={{ borderColor: type === "strength" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1.5 h-1.5 rounded-full ${type === "strength" ? "bg-[var(--accent-green)]" : "bg-[var(--destructive)]"}`} />
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{title}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {type === "strength"
              ? <CheckCircle2 size={13} className="text-[var(--accent-green)] mt-0.5 flex-shrink-0" />
              : <XCircle size={13} className="text-[var(--destructive)] mt-0.5 flex-shrink-0" />}
            <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-center">
      <div className="text-xl font-bold text-[var(--text-primary)] mb-0.5" style={{ fontFamily: "var(--font-geist)" }}>{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
