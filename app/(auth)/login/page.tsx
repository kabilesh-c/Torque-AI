"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setServerError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setServerError(data.error || "Invalid credentials");
      return;
    }

    // Redirect to dashboard or onboarding depending on profile completeness
    const needsOnboarding = !data.user?.jobRole;
    router.push(needsOnboarding ? "/onboarding" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-[var(--border)] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500,
            height: 500,
            top: -100,
            right: -100,
            background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo size={32} />
            <span className="font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
              Torque AI
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
            Welcome back.
          </h2>
          <div className="space-y-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-base">
                  {s.emoji}
                </div>
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{s.value}</div>
                  <div className="text-[var(--text-muted)] text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-[var(--text-muted)]">
          Your sessions and feedback are private and stored securely.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <Link href="/" className="flex items-center gap-2 w-fit mb-8 lg:hidden">
            <Logo size={28} />
            <span className="font-bold" style={{ fontFamily: "var(--font-geist)" }}>Torque AI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
              Sign in
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[var(--text-primary)] underline underline-offset-4 hover:text-[var(--accent)] transition-colors">
                Sign up free
              </Link>
            </p>
          </div>

          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius)] bg-[var(--destructive-dim)] border border-[rgba(239,68,68,0.3)] text-sm text-[var(--destructive)]">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            <Input
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail size={14} />}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                id="login-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                leftIcon={<Lock size={14} />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              id="login-submit"
            >
              {!loading && <>Continue <ArrowRight size={15} /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { emoji: "🎙️", value: "Voice-only sessions", label: "No typing. Just talk." },
  { emoji: "🧠", value: "Dynamic AI interviewer", label: "Pushes back when you're vague" },
  { emoji: "📊", value: "Structured feedback", label: "Score, strengths, and STAR breakdown" },
];
