import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { AutoPrint } from "./AutoPrint";

// Public, read-only interview report — reachable by anyone with the share
// link. Deliberately styled as a light, professional document (independent of
// the app's dark theme) so it reads and prints like a formal report.

export const metadata: Metadata = {
  title: "Interview Feedback Report — Torque AI",
  description: "AI-evaluated mock interview feedback report from Torque AI.",
};

const TYPE_LABELS: Record<string, string> = {
  BEHAVIORAL: "Behavioral Interview",
  TECHNICAL: "Technical Interview",
  SYSTEM_DESIGN: "System Design Interview",
  HR_CULTURE: "HR & Culture Interview",
};

interface StarAnalysis {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  notes?: string;
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const session = await prisma.session.findUnique({
    where: { shareToken: token },
    include: {
      report: true,
      user: { select: { name: true, jobRole: true, experience: true } },
    },
  });

  if (!session || !session.report) notFound();

  const report = session.report;
  const strengths = (report.strengths as string[]) ?? [];
  const weaknesses = (report.weaknesses as string[]) ?? [];
  const star = report.starAnalysis as StarAnalysis | null;
  const duration = session.endedAt
    ? Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
    : null;
  const scoreColor = report.overallScore >= 8 ? "#16a34a" : report.overallScore >= 6 ? "#ca8a04" : report.overallScore >= 4 ? "#0284c7" : "#dc2626";

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white py-8 print:py-0 px-4">
      <AutoPrint />
      <article className="max-w-2xl mx-auto bg-white text-neutral-900 shadow-xl print:shadow-none rounded-lg print:rounded-none overflow-hidden">
        {/* Letterhead */}
        <header className="px-10 pt-10 pb-6 border-b-2 border-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Torque AI" width={32} height={32} className="rounded-md" />
              <span className="text-xl font-bold tracking-tight">Torque AI</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-neutral-500">Interview Feedback Report</span>
          </div>
        </header>

        {/* Candidate + session facts */}
        <section className="px-10 py-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold mb-1">{session.user.name}</h1>
          <p className="text-sm text-neutral-600 mb-4">
            {session.user.jobRole || "Software Engineer"} · {session.user.experience || "—"} experience
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 mb-0.5">Interview type</div>
              <div className="font-medium">{TYPE_LABELS[session.interviewType] || session.interviewType}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 mb-0.5">Date</div>
              <div className="font-medium">
                {new Date(session.startedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 mb-0.5">Duration</div>
              <div className="font-medium">{duration ? `${duration} min` : "—"}</div>
            </div>
          </div>
        </section>

        {/* Score + summary */}
        <section className="px-10 py-6 border-b border-neutral-200">
          <div className="flex items-start gap-6">
            <div
              className="flex-shrink-0 w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-2xl font-bold leading-none" style={{ color: scoreColor }}>
                {report.overallScore}
              </span>
              <span className="text-[10px] text-neutral-400">/ 10</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Overall Assessment</h2>
              <p className="text-sm leading-relaxed text-neutral-700">{report.summary}</p>
            </div>
          </div>
        </section>

        {/* Strengths / weaknesses */}
        <section className="px-10 py-6 border-b border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Strengths</h2>
            {strengths.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">None recorded</p>
            ) : (
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="text-sm text-neutral-700 leading-relaxed flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">+</span> {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Areas to Improve</h2>
            {weaknesses.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">None recorded</p>
            ) : (
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-neutral-700 leading-relaxed flex gap-2">
                    <span className="text-red-500 font-bold flex-shrink-0">−</span> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* STAR analysis */}
        {star && (
          <section className="px-10 py-6 border-b border-neutral-200">
            <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">STAR Framework Coverage</h2>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {(["situation", "task", "action", "result"] as const).map((key) => (
                <div
                  key={key}
                  className={`text-center py-2 rounded border text-sm font-medium capitalize ${
                    star[key]
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {star[key] ? "✓" : "✗"} {key}
                </div>
              ))}
            </div>
            {star.notes && <p className="text-sm text-neutral-600 leading-relaxed">{star.notes}</p>}
          </section>
        )}

        {/* Footer */}
        <footer className="px-10 py-5 flex items-center justify-between text-xs text-neutral-400">
          <span>Generated by Torque AI — AI-powered mock interviews</span>
          <span>torque-llm.vercel.app</span>
        </footer>
      </article>
    </div>
  );
}
