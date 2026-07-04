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
- Mention 1-2 topics you discussed (make it feel like you were paying attention) — ONLY topics that actually appear in the conversation below; never invent any
- Let them know their feedback report will be ready in a moment
- Keep it to 2-3 sentences. Natural, professional tone.
- Do NOT include the words "concludes your interview" — that exact phrase is appended separately.`;

  const userMessage = `Topics covered: ${state.topicsCovered.join(", ")}.
Recent conversation:
${transcriptContext}

Generate a natural closing statement.`;

  let message = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    200
  );

  // The registered Vapi assistant has endCallPhrases matching this — saying it
  // makes Vapi end the call automatically after speaking.
  if (!/concludes (your|our) interview/i.test(message)) {
    message = `${message.trim()} This concludes your interview.`;
  }

  const turn = { speaker: "AI" as const, text: message, graphNode: "wrap_up" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    isComplete: true,
    turnCount: state.turnCount + 1,
  };
}
