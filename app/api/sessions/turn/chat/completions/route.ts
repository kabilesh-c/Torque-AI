import { NextRequest } from "next/server";
import { handleTurnRequest } from "@/lib/interview-engine/turn-handler";

// POST /api/sessions/turn/chat/completions
//
// Vapi's custom-llm provider appends `/chat/completions` to the configured
// model URL and expects an OpenAI-compatible (SSE-streamable) response.
// Session identity comes from the Vapi call metadata.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handleTurnRequest(req);
}
