import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, QUALITY_MODEL } from "../llm";

interface FeedbackReportData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  starAnalysis?: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
    notes: string;
  };
  summary: string;
}

export async function generateReportNode(
  state: InterviewState
): Promise<{ report: FeedbackReportData }> {
  const persona = getPersona(state.interviewType);

  const fullTranscript = state.transcript
    .map((t) => `${t.speaker === "AI" ? "Interviewer" : "Candidate"}: ${t.text}`)
    .join("\n");

  const starSection =
    state.interviewType === "BEHAVIORAL"
      ? `
Also provide a "starAnalysis" object with boolean fields:
- situation: did the candidate clearly describe the situation/context?
- task: did they explain their specific role/responsibility?
- action: did they describe the concrete steps THEY took?
- result: did they share a measurable or meaningful outcome?
- notes: 1-2 sentences on STAR usage patterns overall`
      : "";

  const systemPrompt = `You are a senior interviewer writing a structured feedback report.
Evaluate the following ${state.interviewType.replace("_", " ").toLowerCase()} interview.
Evaluation focus: ${persona.evaluationFocus}

Candidate: ${state.candidateProfile.name}, ${state.candidateProfile.jobRole}, ${state.candidateProfile.experience} experience.

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "overallScore": <integer 1-10>,
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "..."],
  "summary": "3-4 sentence overall assessment"${starSection ? ',\n  "starAnalysis": { "situation": bool, "task": bool, "action": bool, "result": bool, "notes": "..." }' : ""}
}

Be honest and specific. Reference actual things the candidate said.
Do not be generic. A score of 7+ means genuinely strong performance.`;

  const userMessage = `Full interview transcript:\n\n${fullTranscript}`;

  const raw = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    QUALITY_MODEL,
    800
  );

  let report: FeedbackReportData = {
    overallScore: 5,
    strengths: ["Unable to generate feedback — transcript may be too short"],
    weaknesses: [],
    summary: "Feedback generation encountered an issue. Please try again.",
  };

  try {
    const cleaned = raw.replace(/```json?/g, "").replace(/```/g, "").trim();
    report = JSON.parse(cleaned);
  } catch {
    console.error("[GENERATE_REPORT] Failed to parse:", raw);
  }

  return { report };
}
