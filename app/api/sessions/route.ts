import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runIntro } from "@/lib/interview-engine/graph";
import { getPersona } from "@/lib/interview-engine/personas";
import { createInitialState } from "@/lib/interview-engine/state";
import { InterviewType } from "@/lib/interview-engine/state";
import { z } from "zod";

const createSessionSchema = z.object({
  interviewType: z.enum(["BEHAVIORAL", "TECHNICAL", "SYSTEM_DESIGN", "HR_CULTURE"]),
});

// POST /api/sessions — create session, run intro node
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
  }

  const { interviewType } = parsed.data;

  // Fetch full user profile
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { name: true, jobRole: true, experience: true },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Create DB session
  const session = await prisma.session.create({
    data: { userId: user.userId, interviewType, status: "IN_PROGRESS" },
  });

  // Build initial graph state
  const persona = getPersona(interviewType as InterviewType);
  const initialState = createInitialState(
    session.id,
    interviewType as InterviewType,
    { name: dbUser.name, jobRole: dbUser.jobRole || "Software Engineer", experience: dbUser.experience || "3-5 years" },
    persona.topicsPlanned
  );

  // Run intro node to get opening message
  const resultState = await runIntro(initialState);

  // Persist all AI turns from intro
  for (const turn of resultState.transcript) {
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        speaker: turn.speaker,
        text: turn.text,
        graphNode: turn.graphNode || null,
      },
    });
  }

  return NextResponse.json({
    sessionId: session.id,
    openingMessage: resultState.lastAIMessage,
    graphState: resultState,
  });
}

// GET /api/sessions — list past sessions for dashboard
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: user.userId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      interviewType: true,
      status: true,
      startedAt: true,
      endedAt: true,
      report: {
        select: { overallScore: true },
      },
      _count: { select: { transcript: true } },
    },
  });

  return NextResponse.json({ sessions });
}
