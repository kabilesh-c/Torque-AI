import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTurn } from "@/lib/interview-engine/graph";
import { InterviewState, InterviewType } from "@/lib/interview-engine/state";

// POST /api/sessions/turn — Static endpoint for registered Vapi Assistants
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract sessionId from Vapi metadata payload
    const sessionId = 
      body.message?.metadata?.sessionId || 
      body.call?.metadata?.sessionId || 
      body.metadata?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No sessionId found in Vapi metadata payload" },
        { status: 400 }
      );
    }

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
      where: { id: sessionId },
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
      currentQuestionTopic: "",
      followUpCountForCurrentQuestion: 0,
      topicsCovered: [],
      topicsPlanned: [],
      turnCount: transcript.length,
      maxTurns: 16,
      isComplete: false,
    };

    // Run the turn through LangGraph
    const resultState = await runTurn(currentState, candidateText);

    // Persist candidate turn + any new AI turns
    await prisma.turn.create({
      data: {
        sessionId,
        speaker: "CANDIDATE",
        text: candidateText,
      },
    });

    const newAITurns = resultState.transcript.slice(transcript.length + 1);
    for (const turn of newAITurns) {
      if (turn.speaker === "AI") {
        await prisma.turn.create({
          data: {
            sessionId,
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

    // Return format for Vapi custom LLM response
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
  } catch (error: any) {
    console.error("[TURN ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
