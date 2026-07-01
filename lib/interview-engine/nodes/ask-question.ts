import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

export async function askQuestionNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 6);

  const systemPrompt = `${persona.systemPrompt}

Ask a focused question about the topic: "${state.currentQuestionTopic}".
Context from interview so far:
${transcriptContext}

Topics already covered: ${state.topicsCovered.join(", ") || "none yet"}.
Generate a single, crisp question. Do not repeat anything already covered.
Make it specific to a ${state.candidateProfile.jobRole} with ${state.candidateProfile.experience} experience.
Keep it to 1-2 sentences.`;

  const message = await chatCompletion(
    [{ role: "system", content: systemPrompt }],
    FAST_MODEL,
    150
  );

  const turn = {
    speaker: "AI" as const,
    text: message,
    graphNode: "ask_question",
  };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    turnCount: state.turnCount + 1,
  };
}
