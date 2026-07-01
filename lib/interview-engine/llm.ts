import OpenAI from "openai";

// Lazy-initialized client so the module loads even without the env var
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
      defaultHeaders: isOpenRouter ? {
        "HTTP-Referer": "https://mentorque.com",
        "X-Title": "Mentorque",
      } : undefined,
    });
  }
  return _client;
}

// Fast model for real-time conversation turns (low latency)
export const FAST_MODEL = process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini";

// Quality model for post-session feedback report (not latency-sensitive)
export const QUALITY_MODEL = process.env.OPENROUTER_API_KEY ? "openai/gpt-4o" : "gpt-4o";

export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model: string = FAST_MODEL,
  maxTokens: number = 300
): Promise<string> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

// Build a compact transcript string from last N turns (to keep prompts lean)
export function buildTranscriptContext(
  transcript: Array<{ speaker: string; text: string }>,
  lastN: number = 6
): string {
  const recent = transcript.slice(-lastN);
  return recent
    .map((t) => `${t.speaker === "AI" ? "Interviewer" : "Candidate"}: ${t.text}`)
    .join("\n");
}
