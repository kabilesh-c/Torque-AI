import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

export async function followUpNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 6);

  const systemPrompt = `${persona.systemPrompt}

The candidate's last answer was vague or incomplete. 
Generate a specific, contextual follow-up question that references EXACTLY what the candidate said.
Do NOT use generic phrases like "Can you tell me more?" or "Could you elaborate?"
Instead, pick one specific thing they mentioned and ask them to go deeper.
Example: if they said "I worked with the team", ask "What was your specific role in that team decision?"
Keep it to 1-2 sentences. Natural, conversational.`;

  const userMessage = `Topic: ${state.currentQuestionTopic}
Recent conversation:
${transcriptContext}

Generate a targeted follow-up question referencing what the candidate just said.`;

  const message = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    150
  );

  const turn = { speaker: "AI" as const, text: message, graphNode: "follow_up" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    followUpCountForCurrentQuestion: state.followUpCountForCurrentQuestion + 1,
    turnCount: state.turnCount + 1,
  };
}
