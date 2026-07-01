import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, buildTranscriptContext, FAST_MODEL } from "../llm";

export async function acknowledgeAndAdvanceNode(
  state: InterviewState
): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const transcriptContext = buildTranscriptContext(state.transcript, 4);

  // Find the next uncovered topic
  const nextTopic = state.topicsPlanned.find(
    (t) => !state.topicsCovered.includes(t)
  ) || state.topicsPlanned[state.topicsPlanned.length - 1];

  const systemPrompt = `${persona.systemPrompt}

The candidate gave a strong answer. Briefly acknowledge it — one natural sentence (not sycophantic, not just "great answer!").
Then smoothly transition to the next area: "${nextTopic}".
Do NOT use phrases like "Let's move on to our next question" — make it feel like a natural conversation.
Keep total response to 2-3 sentences.`;

  const userMessage = `Recent conversation:
${transcriptContext}

Acknowledge the strong answer and naturally transition to the topic: "${nextTopic}"`;

  const message = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    FAST_MODEL,
    180
  );

  const turn = {
    speaker: "AI" as const,
    text: message,
    graphNode: "acknowledge_and_advance",
  };

  const updatedTopicsCovered = [...state.topicsCovered, state.currentQuestionTopic];

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    topicsCovered: updatedTopicsCovered,
    currentQuestionTopic: nextTopic,
    followUpCountForCurrentQuestion: 0,
    turnCount: state.turnCount + 1,
  };
}
