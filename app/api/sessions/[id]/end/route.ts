import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportNode } from "@/lib/interview-engine/nodes/generate-report";
import { InterviewState, InterviewType } from "@/lib/interview-engine/state";

// POST /api/sessions/[id]/end — mark completed, generate feedback report
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      transcript: { orderBy: { timestamp: "asc" } },
      user: { select: { name: true, jobRole: true, experience: true } },
      report: true,
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.userId !== user.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Idempotent — the client may call this twice (manual end + auto-finish)
  if (session.report) {
    return NextResponse.json({ report: session.report });
  }

  // Mark session as completed
  await prisma.session.update({
    where: { id },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  // Build state for report generation
  const transcript = session.transcript.map((t) => ({
    speaker: t.speaker as "AI" | "CANDIDATE",
    text: t.text,
    graphNode: t.graphNode || undefined,
  }));

  const state: InterviewState = {
    sessionId: id,
    interviewType: session.interviewType as InterviewType,
    candidateProfile: {
      name: session.user.name,
      jobRole: session.user.jobRole || "Software Engineer",
      experience: session.user.experience || "3-5 years",
    },
    transcript,
    currentQuestionTopic: "",
    followUpCountForCurrentQuestion: 0,
    topicsCovered: [],
    topicsPlanned: [],
    turnCount: transcript.length,
    maxTurns: 16,
    isComplete: true,
  };

  // Generate report (uses quality model, runs async)
  const { report } = await generateReportNode(state);

  // Store report
  const savedReport = await prisma.feedbackReport.create({
    data: {
      sessionId: id,
      overallScore: report.overallScore,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      starAnalysis: report.starAnalysis ?? undefined,
      summary: report.summary,
    },
  });

  return NextResponse.json({ report: savedReport });
}
