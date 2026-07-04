import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTurn } from "./graph";
import { InterviewState, InterviewType } from "./state";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Vapi "Custom LLM" turn handler.
//
// Vapi's custom-llm provider treats the configured URL as an OpenAI-compatible
// base URL: it POSTs `{ model, messages, stream: true, call, metadata, ... }`
// to `<url>/chat/completions` and expects an OpenAI chat-completion response —
// SSE-streamed when `stream: true`. This module implements that protocol on
// top of the LangGraph interview engine, and also accepts the legacy
// `{ candidateText }` JSON format for direct API testing.
// ─────────────────────────────────────────────────────────────────────────────

interface OpenAIMessage {
  role: string;
  content: string | Array<{ type?: string; text?: string }> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VapiBody = any;

export function extractSessionId(body: VapiBody): string | undefined {
  return (
    body?.call?.assistantOverrides?.metadata?.sessionId ||
    body?.call?.metadata?.sessionId ||
    body?.metadata?.sessionId ||
    body?.assistant?.metadata?.sessionId ||
    body?.message?.metadata?.sessionId ||
    undefined
  );
}

function messageText(content: OpenAIMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => p?.text ?? "").join(" ").trim();
  }
  return "";
}

export function extractCandidateText(body: VapiBody): string {
  // OpenAI chat format — take the latest user message
  if (Array.isArray(body?.messages)) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i] as OpenAIMessage;
      if (m.role === "user") {
        const text = messageText(m.content);
        if (text) return text;
      }
    }
    return "";
  }

  // Legacy formats
  return (
    body?.message?.transcript?.[body.message.transcript.length - 1]?.content ||
    body?.candidateText ||
    body?.text ||
    ""
  );
}

export interface TurnResult {
  text: string;
  isComplete: boolean;
  turnCount: number;
}

// Phrases that explicitly reference ending the interview/call always count;
// generic sign-offs ("I'm done", "that's all") only count when the utterance
// is short — inside a real answer they're usually mid-sentence filler.
const EXPLICIT_END = /\b(end|stop|finish|quit|leave|conclude|terminate)\b.{0,30}\b(interview|call|session)\b|\b(interview|call|session)\b.{0,20}\b(end|stop|over|done)\b/i;
const GENERIC_END = /\b(i'?m done|i am done|that('?s| is) (all|it)( from me| for me)?|let'?s (stop|end|finish|wrap( it| this)? up)|no more questions|i (want|would like|'?d like) to (stop|quit|leave))\b/i;

export function isEndRequest(text: string): boolean {
  if (EXPLICIT_END.test(text)) return true;
  const words = text.trim().split(/\s+/).length;
  return words <= 10 && GENERIC_END.test(text);
}

/**
 * Run one interview turn: rebuild graph state from the DB transcript, run the
 * LangGraph engine, persist the new turns in a single batched write.
 */
export async function processTurn(
  sessionId: string,
  candidateText: string
): Promise<TurnResult> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcript: { orderBy: { timestamp: "asc" } },
      user: { select: { name: true, jobRole: true, experience: true } },
    },
  });

  if (!session) throw new TurnError(404, "Session not found");
  if (session.status !== "IN_PROGRESS") {
    throw new TurnError(400, "Session is not in progress");
  }

  const transcript = session.transcript.map((t) => ({
    speaker: t.speaker as "AI" | "CANDIDATE",
    text: t.text,
    graphNode: t.graphNode || undefined,
  }));

  // Candidate asked to end — skip the graph, say a graceful goodbye that
  // contains the assistant's end-call phrase so Vapi hangs up on its own,
  // and mark the turn so the report notes the early end.
  if (isEndRequest(candidateText)) {
    const firstName = session.user.name.split(" ")[0] || session.user.name;
    const goodbye =
      `Of course — thank you for your time today, ${firstName}. ` +
      `We'll stop here, and your feedback report will be ready in a moment. ` +
      `This concludes your interview.`;
    const base = Date.now();
    await prisma.turn.createMany({
      data: [
        { sessionId, speaker: "CANDIDATE", text: candidateText, graphNode: "candidate_requested_end", timestamp: new Date(base) },
        { sessionId, speaker: "AI", text: goodbye, graphNode: "early_end", timestamp: new Date(base + 1) },
      ],
    });
    return { text: goodbye, isComplete: true, turnCount: transcript.length + 2 };
  }

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

  const resultState = await runTurn(currentState, candidateText);

  // Persist candidate turn + new AI turns in one batched write. Timestamps are
  // explicitly sequenced — createMany rows would otherwise share now() and the
  // transcript ordering (orderBy timestamp) would become ambiguous.
  const base = Date.now();
  const rows = [
    { sessionId, speaker: "CANDIDATE", text: candidateText, graphNode: null as string | null, timestamp: new Date(base) },
    ...resultState.transcript
      .slice(transcript.length + 1)
      .filter((t) => t.speaker === "AI")
      .map((t, i) => ({
        sessionId,
        speaker: "AI",
        text: t.text,
        graphNode: t.graphNode || null,
        timestamp: new Date(base + i + 1),
      })),
  ];
  await prisma.turn.createMany({ data: rows });

  return {
    text: resultState.lastAIMessage || "",
    isComplete: resultState.isComplete,
    turnCount: resultState.turnCount,
  };
}

export class TurnError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ─── OpenAI-compatible response builders ─────────────────────────────────────

function completionId(): string {
  return `chatcmpl-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Stream `text` back as OpenAI chat-completion SSE chunks, split on sentence
 * boundaries so Vapi's TTS pipeline can start synthesizing the first sentence
 * immediately.
 */
export function openAIStreamResponse(text: string, model = "torque-interview-engine"): Response {
  const id = completionId();
  const created = Math.floor(Date.now() / 1000);
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [text];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      for (let i = 0; i < sentences.length; i++) {
        send({
          id,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [
            {
              index: 0,
              delta: i === 0 ? { role: "assistant", content: sentences[i] } : { content: sentences[i] },
              finish_reason: null,
            },
          ],
        });
      }
      send({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export function openAIJsonResponse(text: string, model = "torque-interview-engine"): Response {
  return NextResponse.json({
    id: completionId(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
}

// ─── Request entry point ─────────────────────────────────────────────────────

/**
 * Handle a turn request in whichever format it arrives:
 * - OpenAI chat format (`body.messages` array) → OpenAI-compatible response,
 *   SSE-streamed when `body.stream` is true. Never returns an error status for
 *   engine failures — a spoken fallback keeps the live call alive.
 * - Legacy `{ candidateText }` format → `{ message, isComplete, turnCount }`.
 */
export async function handleTurnRequest(
  req: Request,
  sessionIdFromPath?: string
): Promise<Response> {
  let body: VapiBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isOpenAIFormat = Array.isArray(body?.messages);
  const wantsStream = isOpenAIFormat && body.stream !== false;
  // Speak `text` back over the call in whichever OpenAI shape was requested
  const respond = (text: string): Response =>
    wantsStream ? openAIStreamResponse(text) : openAIJsonResponse(text);

  const sessionId = sessionIdFromPath || extractSessionId(body);
  const candidateText = extractCandidateText(body).trim();

  if (!sessionId) {
    if (isOpenAIFormat) {
      console.error("[TURN] No sessionId in Vapi payload", JSON.stringify(body?.call?.metadata ?? {}));
      return respond(
        "I'm sorry, I'm having trouble linking this call to your interview session. Please end the call and restart the interview."
      );
    }
    return NextResponse.json({ error: "No sessionId found in payload" }, { status: 400 });
  }

  if (!candidateText) {
    if (isOpenAIFormat) {
      // Vapi occasionally pings before the candidate has said anything
      return respond("I'm listening — please go ahead whenever you're ready.");
    }
    return NextResponse.json({ error: "No candidate text provided" }, { status: 400 });
  }

  try {
    const result = await processTurn(sessionId, candidateText);

    if (isOpenAIFormat) return respond(result.text);

    return NextResponse.json({
      message: result.text,
      isComplete: result.isComplete,
      turnCount: result.turnCount,
    });
  } catch (error) {
    console.error("[TURN ERROR]", error);

    if (isOpenAIFormat) {
      // Keep the live call going instead of killing it with a 5xx
      return respond(
        "Sorry, I had a brief hiccup processing that. Could you repeat your last answer?"
      );
    }

    const status = error instanceof TurnError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
