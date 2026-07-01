// InterviewState — carried through the LangGraph graph

export type InterviewType =
  | "BEHAVIORAL"
  | "TECHNICAL"
  | "SYSTEM_DESIGN"
  | "HR_CULTURE";

export type Speaker = "AI" | "CANDIDATE";

export type AnswerQuality = "strong" | "vague" | "weak" | "incomplete";

export interface Turn {
  speaker: Speaker;
  text: string;
  graphNode?: string;
}

export interface InterviewState {
  sessionId: string;
  interviewType: InterviewType;
  candidateProfile: {
    name: string;
    jobRole: string;
    experience: string;
  };
  transcript: Turn[];
  currentQuestionTopic: string;
  followUpCountForCurrentQuestion: number;
  topicsCovered: string[];
  topicsPlanned: string[]; // internal — never shown to candidate
  turnCount: number;
  maxTurns: number;
  lastAnswerQuality?: AnswerQuality;
  lastAIMessage?: string;
  isComplete: boolean;
  error?: string;
}

export function createInitialState(
  sessionId: string,
  interviewType: InterviewType,
  candidateProfile: { name: string; jobRole: string; experience: string },
  topicsPlanned: string[]
): InterviewState {
  return {
    sessionId,
    interviewType,
    candidateProfile,
    transcript: [],
    currentQuestionTopic: topicsPlanned[0] || "",
    followUpCountForCurrentQuestion: 0,
    topicsCovered: [],
    topicsPlanned,
    turnCount: 0,
    maxTurns: 16,
    isComplete: false,
  };
}
