"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Brain, BarChart3 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
            Torque AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(232,255,0,0.03) 0%, transparent 70%),
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 60px 60px, 60px 60px",
          }}
        />

        {/* Glow orb background */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 600,
            height: 600,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -55%)",
            background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, rgba(232,255,0,0.03) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] mb-8 text-xs text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            AI-powered voice interviews · No scripts, no shortcuts
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
            style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.04em", lineHeight: 1.05 }}
          >
            Interview prep that
            <br />
            <span style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #b8ff00 50%, #80e000 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              actually challenges you
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10 leading-relaxed">
            A live AI interviewer that listens to your answers, decides in real time to push back, probe deeper, or move on — then gives you an honest score.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="gap-2">
                Start your first interview <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-muted)]">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--text-muted)] to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              Not a quiz. An actual interview.
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Every question is generated fresh from the full context of your conversation. No question bank. No fixed script.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="relative p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] group hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-4 group-hover:border-[var(--border-strong)] transition-colors">
                  <f.icon size={18} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview types */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              Four interview modes
            </h2>
            <p className="text-[var(--text-secondary)]">Start with Behavioral — we built that first, and built it well.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interviewTypes.map((t, i) => (
              <div
                key={t.label}
                className={`p-4 rounded-[var(--radius-lg)] border transition-all duration-200 ${
                  i === 0
                    ? "border-[rgba(232,255,0,0.3)] bg-[var(--accent-dim)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="text-2xl mb-2">{t.emoji}</div>
                <div className="font-medium text-sm text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
                  {t.label}
                </div>
                {i === 0 && (
                  <div className="text-[10px] text-[var(--accent)] mt-1 font-medium uppercase tracking-wide">
                    Recommended first
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-4xl font-bold mb-4 text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
          >
            Ready to get uncomfortable?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Set up takes 60 seconds. The interview will challenge you in the first minute.
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Create free account <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            Torque AI
          </div>
          <span>AI-powered mock interviews &mdash; practice like it's real</span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Mic,
    title: "Voice only",
    desc: "Speak naturally. The AI listens, transcribes, and decides its next move — just like a real interviewer.",
  },
  {
    icon: Brain,
    title: "Dynamic follow-ups",
    desc: "Every question is generated from the full context of your conversation. Vague answers get pushed on. Strong answers advance.",
  },
  {
    icon: BarChart3,
    title: "Honest feedback",
    desc: "After every session, get a structured report: overall score, strengths, weaknesses, and STAR coverage breakdown.",
  },
];

const interviewTypes = [
  { emoji: "🧠", label: "Behavioral" },
  { emoji: "💻", label: "Technical" },
  { emoji: "🏗️", label: "System Design" },
  { emoji: "🤝", label: "HR / Culture" },
];
