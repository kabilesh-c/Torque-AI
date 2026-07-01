import { InterviewState } from "../state";
import { getPersona } from "../personas";
import { chatCompletion, FAST_MODEL } from "../llm";

export async function introNode(state: InterviewState): Promise<Partial<InterviewState>> {
  const persona = getPersona(state.interviewType);
  const { name, jobRole, experience } = state.candidateProfile;

  const systemPrompt = `${persona.systemPrompt}

You are opening a ${state.interviewType.replace("_", " ").toLowerCase()} interview.
The candidate is ${name}, applying for a ${jobRole} role, with ${experience} of experience.
Topics you plan to cover (internal, do NOT reveal): ${persona.topicsPlanned.join(", ")}.

Generate a warm, professional opening: briefly introduce yourself as an interviewer (no name needed), set context for the interview, and ask your first question on "${persona.topicsPlanned[0]}".
Keep it concise — 3-4 sentences max. Natural, conversational tone.`;

  const message = await chatCompletion(
    [{ role: "system", content: systemPrompt }],
    FAST_MODEL,
    250
  );

  const turn = { speaker: "AI" as const, text: message, graphNode: "intro" };

  return {
    transcript: [...state.transcript, turn],
    lastAIMessage: message,
    currentQuestionTopic: state.topicsPlanned[0] || "",
    turnCount: state.turnCount + 1,
  };
}
