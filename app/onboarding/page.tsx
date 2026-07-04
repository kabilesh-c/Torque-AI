"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, User, Briefcase, TrendingUp, Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Your name", icon: User },
  { id: 2, label: "Job role", icon: Briefcase },
  { id: 3, label: "Experience", icon: TrendingUp },
];

const EXPERIENCE_OPTIONS = [
  { value: "0-2 years", label: "0–2 years (Entry level)" },
  { value: "3-5 years", label: "3–5 years (Mid level)" },
  { value: "5-8 years", label: "5–8 years (Senior)" },
  { value: "8+ years", label: "8+ years (Staff / Lead)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", jobRole: "", experience: "3-5 years" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === 1 && !form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (step === 2 && !form.jobRole.trim()) {
      setError("Please enter your job role");
      return;
    }
    setError("");
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/interview/new");
    } else {
      setError("Failed to save profile. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="fixed top-6 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <Zap size={14} className="text-black" />
        </div>
        <span className="font-bold text-sm text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>Torque AI</span>
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${((step) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s.id < step
                    ? "bg-[var(--accent)] text-black"
                    : s.id === step
                    ? "border-2 border-[var(--accent)] text-[var(--accent)]"
                    : "border border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {s.id < step ? <Check size={12} /> : s.id}
              </div>
              {s.id < STEPS.length && (
                <div
                  className="w-8 h-px transition-all duration-500"
                  style={{ background: s.id < step ? "var(--accent)" : "var(--border)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="animate-slide-up">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
                  What&apos;s your name?
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  The AI interviewer will address you personally.
                </p>
              </div>
              <Input
                id="onboarding-name"
                type="text"
                placeholder="Alex Johnson"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                error={error}
                leftIcon={<User size={14} />}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
                  What role are you targeting?
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  The interviewer will tailor questions to your specific role.
                </p>
              </div>
              <Input
                id="onboarding-role"
                type="text"
                placeholder="e.g. Senior Software Engineer, Product Manager..."
                value={form.jobRole}
                onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                error={error}
                leftIcon={<Briefcase size={14} />}
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2">
                {["Software Engineer", "Product Manager", "Data Scientist", "Engineering Manager"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, jobRole: role })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 ${
                      form.jobRole === role
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
                  How much experience do you have?
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  This sets the difficulty and depth of the interview questions.
                </p>
              </div>
              <div className="grid gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, experience: opt.value })}
                    className={`flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border text-left transition-all duration-200 ${
                      form.experience === opt.value
                        ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.experience === opt.value ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)]"
                    }`}>
                      {form.experience === opt.value && <Check size={9} className="text-black" />}
                    </div>
                    <span className={`text-sm font-medium ${form.experience === opt.value ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-10">
          {step > 1 ? (
            <button
              onClick={() => { setStep(step - 1); setError(""); }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            variant="primary"
            size="md"
            loading={loading}
            id={`onboarding-step-${step}`}
          >
            {step === 3 ? (loading ? "" : "Start interviewing") : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
