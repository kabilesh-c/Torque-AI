import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

export async function probeNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 6);

  const systemPrompt = `${persona.systemPrompt}

The candidate's last answer was weak, incorrect, or contradicted something they said earlier.
Generate a respectful but firm pushback. Your tone should be curious, not confrontational.
Reference something SPECIFIC the candidate said that is problematic, incorrect, or missing.
Example approaches:
- "You mentioned X, but earlier you said Y — help me understand how those fit together."
- "That approach might work, but what happens when [specific edge case]? Walk me through that."
- "I want to push back gently on that — in my experience [specific concern]. How would you address that?"
Keep it to 1-2 sentences. Do not lecture. Ask them to respond.`;

  const userMessage = `Topic: ${state.currentQuestionTopic}
Recent conversation:
${transcriptContext}

Generate a respectful but firm pushback on the candidate's weak or problematic answer.`;

  const message = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    180
  );

  const turn = { speaker: "AI" as const, text: message, graphNode: "probe" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    followUpCountForCurrentQuestion: state.followUpCountForCurrentQuestion + 1,
    turnCount: state.turnCount + 1,
  };
}
