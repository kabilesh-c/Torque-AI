import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runTurn } from "@/lib/interview-engine/graph";
import { InterviewState, InterviewType } from "@/lib/interview-engine/state";

// POST /api/sessions/[id]/turn — Vapi webhook + regular turn processing
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth — allow both cookie auth and Vapi webhook (Vapi sends sessionId in body)
  const user = await getCurrentUser();

  const body = await req.json();

  // Support both Vapi webhook format and direct API calls
  const candidateText: string =
    body.message?.transcript?.[body.message.transcript.length - 1]?.content ||
    body.candidateText ||
    body.text ||
    "";

  if (!candidateText.trim()) {
    return NextResponse.json({ error: "No candidate text provided" }, { status: 400 });
  }

  // Fetch session with all turns
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      transcript: { orderBy: { timestamp: "asc" } },
      user: { select: { name: true, jobRole: true, experience: true } },
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Session is not in progress" }, { status: 400 });
  }

  // Rebuild graph state from DB transcript
  const transcript = session.transcript.map((t) => ({
    speaker: t.speaker as "AI" | "CANDIDATE",
    text: t.text,
    graphNode: t.graphNode || undefined,
  }));

  const currentState: InterviewState = {
    sessionId: session.id,
    interviewType: session.interviewType as InterviewType,
    candidateProfile: {
      name: session.user.name,
      jobRole: session.user.jobRole || "Software Engineer",
      experience: session.user.experience || "3-5 years",
    },
    transcript,
    currentQuestionTopic: "", // Will be inferred from transcript
    followUpCountForCurrentQuestion: 0,
    topicsCovered: [],
    topicsPlanned: [], // Will use persona defaults
    turnCount: transcript.length,
    maxTurns: 16,
    isComplete: false,
  };

  // Run the turn through LangGraph
  const resultState = await runTurn(currentState, candidateText);

  // Persist candidate turn + any new AI turns
  await prisma.turn.create({
    data: {
      sessionId: id,
      speaker: "CANDIDATE",
      text: candidateText,
    },
  });

  const newAITurns = resultState.transcript.slice(transcript.length + 1);
  for (const turn of newAITurns) {
    if (turn.speaker === "AI") {
      await prisma.turn.create({
        data: {
          sessionId: id,
          speaker: "AI",
          text: turn.text,
          graphNode: turn.graphNode || null,
        },
      });
    }
  }

  const aiResponse = resultState.lastAIMessage || "";

  // If session is wrapping up, return isComplete flag
  if (resultState.isComplete) {
    return NextResponse.json({
      message: aiResponse,
      isComplete: true,
    });
  }

  // Vapi expects: { "results": [{ "toolCallId": "...", "result": "..." }] }
  // But also support plain JSON for direct calls
  const vapiToolCallId = body.message?.toolCallList?.[0]?.id;
  if (vapiToolCallId) {
    return NextResponse.json({
      results: [{ toolCallId: vapiToolCallId, result: aiResponse }],
    });
  }

  return NextResponse.json({
    message: aiResponse,
    isComplete: false,
    turnCount: resultState.turnCount,
  });
}
