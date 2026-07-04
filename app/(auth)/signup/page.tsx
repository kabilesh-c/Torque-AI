"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setServerError(data.error || "Something went wrong");
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-[var(--border)] relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500,
            height: 500,
            bottom: -100,
            left: -100,
            background: "radial-gradient(circle, rgba(232,255,0,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
              Torque AI
            </span>
          </Link>
        </div>

        <div className="relative z-10">
          <blockquote className="space-y-4">
            <p
              className="text-3xl font-bold leading-tight text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}
            >
              &ldquo;The AI pushed back on every vague answer. After two sessions, my actual interview felt easy.&rdquo;
            </p>
            <footer className="text-sm text-[var(--text-muted)]">
              Software Engineer, Series B startup
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
            Voice-only AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
            No question scripts
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Honest feedback
          </span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 w-fit mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold" style={{ fontFamily: "var(--font-geist)" }}>Torque AI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Already have one?{" "}
              <Link href="/login" className="text-[var(--text-primary)] underline underline-offset-4 hover:text-[var(--accent)] transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius)] bg-[var(--destructive-dim)] border border-[rgba(239,68,68,0.3)] text-sm text-[var(--destructive)]">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="signup-form">
            <Input
              id="signup-name"
              label="Full name"
              type="text"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              leftIcon={<User size={14} />}
              autoComplete="name"
            />
            <Input
              id="signup-email"
              label="Email address"
              type="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              leftIcon={<Mail size={14} />}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                id="signup-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                leftIcon={<Lock size={14} />}
                autoComplete="new-password"
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
              className="w-full mt-2"
              loading={loading}
              id="signup-submit"
            >
              {!loading && <>Create account <ArrowRight size={15} /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            By signing up you agree to our{" "}
            <span className="text-[var(--text-secondary)]">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}
