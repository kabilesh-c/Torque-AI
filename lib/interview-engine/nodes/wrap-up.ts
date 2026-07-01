import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

export async function wrapUpNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 4);

  const systemPrompt = `${persona.systemPrompt}

The interview is now wrapping up. Generate a natural, warm closing statement.
- Thank the candidate for their time
- Mention 1-2 topics you discussed (make it feel like you were paying attention)
- Let them know they'll receive feedback shortly
- Keep it to 3-4 sentences. Natural, professional tone.`;

  const userMessage = `Topics covered: ${state.topicsCovered.join(", ")}.
Recent conversation:
${transcriptContext}

Generate a natural closing statement.`;

  const message = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    200
  );

  const turn = { speaker: "AI" as const, text: message, graphNode: "wrap_up" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    isComplete: true,
    turnCount: state.turnCount + 1,
  };
}
