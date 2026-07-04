import { NextRequest } from "next/server";
import { handleTurnRequest } from "@/lib/interview-engine/turn-handler";

// POST /api/sessions/[id]/turn/chat/completions
//
// OpenAI-compatible custom-llm endpoint with the session id in the path —
// used when the assistant's model URL points at a specific session.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleTurnRequest(req, id);
}
