import { InterviewState } from "../state";
import { getPersona, INTERVIEWER_NAME } from "../personas";

const TYPE_LABELS: Record<string, string> = {
  BEHAVIORAL: "behavioral",
  TECHNICAL: "technical",
  SYSTEM_DESIGN: "system design",
  HR_CULTURE: "HR and culture",
};

/**
 * Templated opening — no LLM call. This runs at session creation, so keeping
 * it instant is what makes "select type → start interview" feel snappy.
 * Introduces the interviewer by name, sets expectations (5 questions,
 * follow-ups, short duration, how to stop), and asks the persona's canned
 * first question.
 */
export async function introNode(state: InterviewState): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const { name, jobRole } = state.candidateProfile;
  const firstName = name.split(" ")[0] || name;
  const typeLabel = TYPE_LABELS[state.interviewType] || "practice";

  const message =
    `Hi ${firstName}, I'm ${INTERVIEWER_NAME}, your interviewer from Torque AI. ` +
    `Today we'll do a ${typeLabel} interview for the ${jobRole} role. ` +
    `I'll ask you around five questions, with a few follow-ups where needed — it shouldn't take more than fifteen to twenty minutes. ` +
    `If you'd like to stop at any point, just say so. ` +
    persona.firstQuestion;

  const turn = { speaker: "AI" as const, text: message, graphNode: "intro" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    currentQuestionTopic: state.topicsPlanned[0] || "",
    turnCount: state.turnCount + 1,
  };
}
