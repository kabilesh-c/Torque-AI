"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Brain, BarChart3, FileDown, Repeat, AudioLines, ChevronDown, Github, Linkedin, Mail, Heart } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { FaultyTerminal } from "@/components/ui/faulty-terminal";

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
        {/* Faulty terminal background */}
        <div className="absolute inset-0 pointer-events-none">
          <FaultyTerminal
            scale={1.5}
            digitSize={1.2}
            scanlineIntensity={0.5}
            glitchAmount={1}
            flickerAmount={1}
            noiseAmp={1}
            chromaticAberration={0}
            dither={0}
            curvature={0.1}
            tint="#b8ff00"
            mouseReact
            mouseStrength={0.5}
            brightness={0.6}
            className="w-full h-full opacity-40"
          />
        </div>

        {/* Legibility scrim over the terminal effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 45%, transparent 75%), linear-gradient(to bottom, var(--bg) 0%, transparent 12%, transparent 85%, var(--bg) 100%)",
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
            Meet Ava — a live AI interviewer that listens to your answers, decides in real time to push back, probe deeper, or move on — then gives you an honest score.
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

      {/* Interview rounds — detailed */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              Four rounds. One complete loop.
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Each round is a focused, ~15–20 minute session — around five questions with follow-ups whenever your answer leaves room to dig.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewTypes.map((t, i) => (
              <div
                key={t.label}
                className={`p-6 rounded-[var(--radius-xl)] border transition-all duration-200 hover:bg-[var(--surface-elevated)] ${
                  i === 0
                    ? "border-[rgba(232,255,0,0.3)] bg-[var(--accent-dim)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{t.emoji}</div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
                      {t.label}
                    </div>
                    {i === 0 && (
                      <div className="text-[10px] text-[var(--accent)] font-medium uppercase tracking-wide">
                        Recommended first
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{t.desc}</p>
                <div className="text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text-secondary)]">Evaluates:</span> {t.evaluates}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Torque AI */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              Why Torque AI
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Reading interview tips doesn&apos;t make you better at interviews. Reps do. Torque AI turns preparation into a loop you can run every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whyItems.map((w, i) => (
              <div
                key={w.title}
                className="relative p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center">
                    <w.icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <span className="text-4xl font-bold text-[var(--surface-elevated)]" style={{ fontFamily: "var(--font-geist)" }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)" }}>
                  {w.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
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
      <footer className="border-t border-[var(--border)] px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Logo size={22} />
              <span className="font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>Torque AI</span>
              <span className="text-[var(--text-muted)] hidden sm:inline">— practice like it&apos;s real</span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/kabilesh-c"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Github size={17} />
              </a>
              <a
                href="https://www.linkedin.com/in/kabilesh-c20"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Linkedin size={17} />
              </a>
              <a
                href="mailto:kabileshc.dev@gmail.com"
                title="kabileshc.dev@gmail.com"
                className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Mail size={17} />
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              Made with <Heart size={12} className="text-[var(--destructive)] fill-[var(--destructive)]" /> by{" "}
              <a
                href="https://github.com/kabilesh-c"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-medium"
              >
                Kabilesh C
              </a>
            </span>
            <a href="mailto:kabileshc.dev@gmail.com" className="hover:text-[var(--text-secondary)] transition-colors">
              kabileshc.dev@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--surface-elevated)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
          {question}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          {answer}
        </div>
      )}
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
  {
    emoji: "🧠",
    label: "Behavioral",
    desc: "Ava digs into your real work stories — conflicts, failures, leading without authority, pressure. Vague answers get a follow-up; deflection gets a polite push-back. Exactly like a good hiring manager would.",
    evaluates: "STAR completeness, specificity of examples, ownership vs. deflection, self-awareness",
  },
  {
    emoji: "💻",
    label: "Technical",
    desc: "A peer-level technical phone screen. You reason out loud through data structures, debugging, and optimization problems while Ava probes edge cases: \"What if the input is null? How does that scale to 10 million records?\"",
    evaluates: "correctness, depth under probing, edge-case reasoning, thinking out loud",
  },
  {
    emoji: "🏗️",
    label: "System Design",
    desc: "Design real systems in conversation — starting with requirements. Ava rewards clarifying questions, challenges your assumptions (\"Why SQL over NoSQL here?\"), and asks what breaks first at scale.",
    evaluates: "requirements clarification, trade-off discussion, scalability awareness, handling pushback",
  },
  {
    emoji: "🤝",
    label: "HR / Culture",
    desc: "The round most people underestimate. Motivations, working style, values — with \"what if\" twists that test your judgment: \"What if your manager disagreed with your approach?\"",
    evaluates: "motivation clarity, values alignment, situational judgment under what-if scenarios",
  },
];

const whyItems = [
  {
    icon: AudioLines,
    title: "Practice like it's real",
    desc: "A live voice conversation with Ava — she introduces herself, asks around five questions, follows up when your answers leave gaps, and wraps up on time. Real pressure, zero stakes.",
  },
  {
    icon: FileDown,
    title: "Walk away with a report",
    desc: "Every session ends with an honest, transcript-grounded report — score, strengths, areas to improve, STAR coverage. Download it as a polished PDF or share it with a mentor via a public link.",
  },
  {
    icon: Repeat,
    title: "Improve constantly",
    desc: "Your dashboard keeps every session and score. Retake the same round tomorrow, watch the score move, and attack the weaknesses your last report called out. Improvement you can measure.",
  },
];

const faqs = [
  {
    q: "How does the AI interview actually work?",
    a: "You talk to Ava over a live voice call in your browser. She listens to each answer, evaluates it in real time, and decides what to do next — ask a follow-up, probe a weak spot, or move to a new topic. Nothing is scripted; every question is generated from what you actually said.",
  },
  {
    q: "How long does an interview take?",
    a: "Around 15–20 minutes. Ava tells you the format up front: roughly five questions with follow-ups where needed. When time or questions run out, she wraps up with a short summary and the call ends automatically.",
  },
  {
    q: "Can I end an interview early?",
    a: "Yes — just say so. Tell Ava \"let's end the interview\" or \"I'm done\" and she'll thank you, end the call gracefully, and still generate a report for whatever was covered.",
  },
  {
    q: "What's in the feedback report?",
    a: "An overall score out of 10, your specific strengths, concrete areas to improve, and — for behavioral rounds — a STAR framework breakdown. Every claim is grounded in your actual transcript. You can download it as a PDF or share it with a public link.",
  },
  {
    q: "What do I need to start?",
    a: "A browser, a microphone, and a reasonably quiet room. No installs. If Ava can't hear you, she'll ask \"Am I audible?\" and guide you — and if it's a technical issue, she'll tell you honestly instead of leaving you hanging.",
  },
  {
    q: "Is my interview data private?",
    a: "Yes. Your sessions and reports are visible only to you unless you explicitly create a share link for a report. Share links show the report only — never your full transcript.",
  },
];
