import { InterviewState, AnswerQuality } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

interface EvaluationResult {
  quality: AnswerQuality;
  reasoning: string;
}

export async function evaluateAnswerNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 8);

  const systemPrompt = `${persona.systemPrompt}

You are evaluating the candidate's latest answer.
Evaluation focus: ${persona.evaluationFocus}

Classify the answer as one of:
- "strong": complete, specific, well-structured answer with evidence/examples
- "vague": answer is generic, too broad, or lacks specific details/examples  
- "weak": incorrect, contradictory, shows gaps in understanding, or deflects responsibility
- "incomplete": answer started well but didn't finish a key component (e.g., missing Result in STAR)

Respond ONLY with valid JSON in this exact format:
{"quality": "strong|vague|weak|incomplete", "reasoning": "one sentence explanation"}`;

  const userMessage = `Current topic: ${state.currentQuestionTopic}
Recent conversation:
${transcriptContext}

Evaluate the candidate's last response.`;

  const raw = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    150
  );

  let result: EvaluationResult = { quality: "vague", reasoning: "" };
  try {
    // Strip any markdown fences if model adds them
    const cleaned = raw.replace(/```json?/g, "").replace(/```/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    console.error("[EVALUATE] Failed to parse:", raw);
  }

  return {
    lastAnswerQuality: result.quality,
  };
}
