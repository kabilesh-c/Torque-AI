import { StateGraph, END } from "@langchain/langgraph";
import { InterviewState, AnswerQuality } from "./state";
import { introNode } from "./nodes/intro";
import { evaluateAnswerNode } from "./nodes/evaluate-answer";
import { followUpNode } from "./nodes/follow-up";
import { probeNode } from "./nodes/probe";
import { acknowledgeAndAdvanceNode } from "./nodes/acknowledge-and-advance";
import { askQuestionNode } from "./nodes/ask-question";
import { wrapUpNode } from "./nodes/wrap-up";

// ─── Conditional routing functions ───────────────────────────────────────────

function routeAfterEvaluation(state: InterviewState): string {
  const { lastAnswerQuality, followUpCountForCurrentQuestion, turnCount, maxTurns } = state;

  // Hit turn budget — wrap up
  if (turnCount >= maxTurns) return "wrap_up";

  switch (lastAnswerQuality as AnswerQuality) {
    case "strong":
      return "acknowledge_and_advance";

    case "vague":
    case "incomplete":
      // Allow up to 2 follow-ups per question, then advance anyway
      if (followUpCountForCurrentQuestion < 2) return "follow_up";
      return "acknowledge_and_advance";

    case "weak":
      // Push back once, then advance
      if (followUpCountForCurrentQuestion < 1) return "probe";
      return "acknowledge_and_advance";

    default:
      return "acknowledge_and_advance";
  }
}

function routeAfterAcknowledge(state: InterviewState): string {
  const { topicsCovered, topicsPlanned, turnCount, maxTurns } = state;

  if (turnCount >= maxTurns) return "wrap_up";

  const allCovered = topicsPlanned.every((t) => topicsCovered.includes(t));
  if (allCovered) return "wrap_up";

  return "ask_question";
}

function routeEntry(state: InterviewState): string {
  // If we have a candidate response as the latest turn, go directly to evaluation
  const lastTurn = state.transcript[state.transcript.length - 1];
  if (lastTurn && lastTurn.speaker === "CANDIDATE") {
    return "evaluate_answer";
  }
  return "intro";
}

// ─── Graph builder ────────────────────────────────────────────────────────────

export function buildInterviewGraph() {
  const graph = new StateGraph<InterviewState>({
    channels: {
      sessionId: { value: (a: string, b: string) => b ?? a },
      interviewType: { value: (a: string, b: string) => b ?? a },
      candidateProfile: { value: (a: object, b: object) => b ?? a },
      transcript: {
        value: (a: InterviewState["transcript"], b: InterviewState["transcript"]) => b ?? a,
        default: () => [],
      },
      currentQuestionTopic: { value: (a: string, b: string) => b ?? a, default: () => "" },
      followUpCountForCurrentQuestion: {
        value: (a: number, b: number) => b ?? a,
        default: () => 0,
      },
      topicsCovered: { value: (a: string[], b: string[]) => b ?? a, default: () => [] },
      topicsPlanned: { value: (a: string[], b: string[]) => b ?? a, default: () => [] },
      turnCount: { value: (a: number, b: number) => b ?? a, default: () => 0 },
      maxTurns: { value: (a: number, b: number) => b ?? a, default: () => 16 },
      lastAnswerQuality: { value: (a: AnswerQuality | undefined, b: AnswerQuality | undefined) => b ?? a },
      lastAIMessage: { value: (a: string | undefined, b: string | undefined) => b ?? a },
      isComplete: { value: (a: boolean, b: boolean) => b ?? a, default: () => false },
      error: { value: (a: string | undefined, b: string | undefined) => b ?? a },
    },
  });

  // Add all nodes
  graph.addNode("start", (state) => state);
  graph.addNode("intro", introNode);
  graph.addNode("evaluate_answer", evaluateAnswerNode);
  graph.addNode("follow_up", followUpNode);
  graph.addNode("probe", probeNode);
  graph.addNode("acknowledge_and_advance", acknowledgeAndAdvanceNode);
  graph.addNode("ask_question", askQuestionNode);
  graph.addNode("wrap_up", wrapUpNode);

  // Set entry point
  graph.setEntryPoint("start");

  // Conditional entry routing
  graph.addConditionalEdges("start", routeEntry, {
    intro: "intro",
    evaluate_answer: "evaluate_answer",
  });

  // Static edges
  graph.addEdge("intro", "ask_question");
  graph.addEdge("ask_question", END); // END here — Vapi provides next candidate turn
  graph.addEdge("follow_up", END);
  graph.addEdge("probe", END);
  graph.addEdge("wrap_up", END);

  // Conditional routing after evaluation
  graph.addConditionalEdges("evaluate_answer", routeAfterEvaluation, {
    follow_up: "follow_up",
    probe: "probe",
    acknowledge_and_advance: "acknowledge_and_advance",
    wrap_up: "wrap_up",
  });

  // Conditional routing after acknowledge
  graph.addConditionalEdges("acknowledge_and_advance", routeAfterAcknowledge, {
    ask_question: "ask_question",
    wrap_up: "wrap_up",
  });

  return graph.compile();
}

// ─── Per-turn entry point (used by Vapi webhook) ─────────────────────────────

/**
 * Run the graph for a single candidate turn.
 * 1. Appends the candidate utterance to transcript
 * 2. Runs evaluate_answer → routes to follow_up | probe | acknowledge_and_advance
 * 3. Returns updated state with the AI's response message
 */
export async function runTurn(
  state: InterviewState,
  candidateText: string
): Promise<InterviewState> {
  const compiledGraph = buildInterviewGraph();

  // Append candidate's turn to transcript
  const stateWithCandidate: InterviewState = {
    ...state,
    transcript: [
      ...state.transcript,
      { speaker: "CANDIDATE", text: candidateText, graphNode: undefined },
    ],
    turnCount: state.turnCount,
  };

  // Run from evaluate_answer node
  const result = await compiledGraph.invoke(stateWithCandidate, {
    recursionLimit: 10,
  });

  return result as InterviewState;
}

/**
 * Run the intro node to start a session.
 */
export async function runIntro(state: InterviewState): Promise<InterviewState> {
  const compiledGraph = buildInterviewGraph();
  const result = await compiledGraph.invoke(state, { recursionLimit: 5 });
  return result as InterviewState;
}
