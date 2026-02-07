import type {
  AgentRunState,
  AgentAction,
} from "@/lib/agent-types";

// ─── Initial State ──────────────────────────────────────────────────

export const initialState: AgentRunState = {
  status: "idle",
  task: "",
  steps: [],
  currentText: "",
};

// ─── Helpers ────────────────────────────────────────────────────────

export function ensureCurrentStep(state: AgentRunState): AgentRunState {
  if (state.steps.length === 0) {
    return { ...state, steps: [{ index: 0, text: "", toolCalls: [] }] };
  }
  return state;
}

// ─── Reducer ────────────────────────────────────────────────────────

export function agentReducer(
  state: AgentRunState,
  action: AgentAction
): AgentRunState {
  switch (action.type) {
    case "START":
      return {
        status: "running",
        task: action.task,
        steps: [{ index: 0, text: "", toolCalls: [], startedAt: Date.now() }],
        currentText: "",
      };

    case "TEXT_DELTA": {
      const s = ensureCurrentStep(state);
      const steps = [...s.steps];
      const last = { ...steps[steps.length - 1] };
      last.text += action.text;
      steps[steps.length - 1] = last;
      return { ...s, steps, currentText: s.currentText + action.text };
    }

    case "TOOL_CALL": {
      const s = ensureCurrentStep(state);
      const steps = [...s.steps];
      const last = { ...steps[steps.length - 1] };
      last.toolCalls = [
        ...last.toolCalls,
        {
          id: action.toolCallId,
          name: action.toolName,
          args: action.args,
          status: "executing",
        },
      ];
      steps[steps.length - 1] = last;
      return { ...s, steps };
    }

    case "TOOL_RESULT": {
      const steps = state.steps.map((step) => ({
        ...step,
        toolCalls: step.toolCalls.map((tc) =>
          tc.id === action.toolCallId
            ? { ...tc, result: action.result, status: "done" as const }
            : tc
        ),
      }));
      return { ...state, steps };
    }

    case "TOOL_ERROR": {
      const steps = state.steps.map((step) => ({
        ...step,
        toolCalls: step.toolCalls.map((tc) =>
          tc.id === action.toolCallId
            ? { ...tc, error: action.error, status: "error" as const }
            : tc
        ),
      }));
      return { ...state, steps };
    }

    case "STEP_FINISH": {
      const prevSteps = state.steps.map((step, i) =>
        i === state.steps.length - 1 ? { ...step, completedAt: Date.now() } : step
      );
      const newStep = { index: action.stepIndex + 1, text: "", toolCalls: [], startedAt: Date.now() };
      return { ...state, steps: [...prevSteps, newStep], currentText: "" };
    }

    case "FINISH": {
      let steps = [...state.steps];
      const last = steps[steps.length - 1];
      if (last && last.text === "" && last.toolCalls.length === 0) {
        steps = steps.slice(0, -1);
      }
      // Mark last step as completed
      if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        if (!lastStep.completedAt) {
          steps = steps.map((s, i) =>
            i === steps.length - 1 ? { ...s, completedAt: Date.now() } : s
          );
        }
      }
      return {
        ...state,
        status: "completed",
        steps,
        finishReason: action.finishReason,
      };
    }

    case "ERROR":
      return { ...state, status: "error", error: action.error };

    case "RESET":
      return initialState;

    case "LOAD":
      return { ...action.runState };

    default:
      return state;
  }
}
