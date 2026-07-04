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

  const candidateTurns = state.transcript.filter((t) => t.speaker === "CANDIDATE");
  const candidateWords = candidateTurns.reduce(
    (n, t) => n + t.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const endedEarly = state.transcript.some(
    (t) => t.graphNode === "early_end" || t.graphNode === "candidate_requested_end"
  );

  // No (or nearly no) candidate speech — don't ask an LLM to grade silence.
  // This is what previously produced fabricated feedback about topics the
  // candidate never discussed.
  if (candidateWords < 15) {
    return {
      report: {
        overallScore: 1,
        strengths: [],
        weaknesses: ["No substantive candidate responses were captured in this session"],
        summary:
          "No spoken responses were received from the candidate during this session — possibly due to a microphone or connection issue, or because the interview ended before any answers were given. No evaluation of the candidate's skills could be made. Please retake the interview to receive proper feedback.",
      },
    };
  }

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

STRICT GROUNDING RULES — violating these makes the report worthless:
- Every claim MUST be based on something the candidate actually said in the transcript below. Quote or closely paraphrase their words.
- NEVER invent topics, answers, skills, or knowledge that do not appear in the transcript. If the interviewer asked about a topic but the candidate did not answer it, do not credit them for it.
- If the candidate gave very few or very short answers, say exactly that and score accordingly (a candidate who answered fewer than 3 questions substantively cannot score above 4).
- It is better to write "not enough evidence to assess X" than to guess.
${endedEarly ? "- NOTE: The candidate chose to end this interview early. State this factually in the summary (not as a criticism) and evaluate only what was covered before the end." : ""}

Be honest and specific. Do not be generic. A score of 7+ means genuinely strong performance.`;

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
