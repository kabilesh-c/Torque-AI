"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { Zap, Plus, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  interviewType: string;
  status: string;
  startedAt: string;
  endedAt?: string | null;
  report?: { overallScore: number } | null;
  _count?: { transcript: number };
}

interface UserProfile {
  name: string;
  email: string;
  jobRole: string;
  experience: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sessionsRes, userRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/me"),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.report?.overallScore ?? 0), 0) /
            completed.length
        )
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(0,0,0,0.85)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-geist)" }}>Mentorque</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            <User size={12} />
            {user?.name || "…"}
          </div>
          <Link href="/interview/new">
            <Button variant="primary" size="sm" className="gap-1.5" id="new-interview-btn">
              <Plus size={13} /> New interview
            </Button>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-all"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome header */}
        <div className="mb-10 animate-slide-up">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.03em" }}>
            {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {user?.jobRole ? `Practicing for ${user.jobRole} · ${user.experience}` : "Your interview history"}
          </p>
        </div>

        {/* Stats row */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10 animate-slide-up" style={{ animationDelay: "60ms", animationFillMode: "both", opacity: 0 }}>
            <StatCard label="Total sessions" value={sessions.length.toString()} />
            <StatCard label="Completed" value={completed.length.toString()} />
            <StatCard label="Avg score" value={avgScore !== null ? `${avgScore}/10` : "—"} accent={avgScore !== null && avgScore >= 7} />
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] shimmer" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist)" }}>
                Past sessions
              </h2>
              <span className="text-xs text-[var(--text-muted)]">{sessions.length} total</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session, i) => (
                <SessionCard key={session.id} session={session} index={i} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <div
        className={`text-3xl font-bold mb-1 ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
        style={{ fontFamily: "var(--font-geist)", letterSpacing: "-0.04em" }}
      >
        {value}
      </div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-6 text-3xl">
        🎙️
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-geist)" }}>
        No interviews yet
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-xs">
        Your first interview is 60 seconds away. The AI won&apos;t go easy on you.
      </p>
      <Link href="/interview/new">
        <Button variant="primary" id="first-interview-btn">Start your first interview</Button>
      </Link>
    </div>
  );
}
