"use client";

import { useReducer, useRef, useCallback } from "react";
import type {
  AgentRunState,
  AgentAction,
  AgentEvent,
} from "@/lib/agent-types";

// ─── Reducer ────────────────────────────────────────────────────────

const initialState: AgentRunState = {
  status: "idle",
  task: "",
  steps: [],
  currentText: "",
};

function ensureCurrentStep(state: AgentRunState): AgentRunState {
  if (state.steps.length === 0) {
    return { ...state, steps: [{ index: 0, text: "", toolCalls: [] }] };
  }
  return state;
}

function agentReducer(
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

// ─── SSE Parser ─────────────────────────────────────────────────────

function parseSSELine(line: string): AgentEvent | null {
  if (!line.startsWith("data: ")) return null;
  try {
    return JSON.parse(line.slice(6)) as AgentEvent;
  } catch {
    return null;
  }
}

// ─── Follow-up Suggestions ──────────────────────────────────────────

export function generateFollowUps(task: string, finalAnswer: string): string[] {
  const suggestions: string[] = [];
  const lower = task.toLowerCase();

  if (lower.includes("research") || lower.includes("compare") || lower.includes("latest")) {
    suggestions.push("Go deeper — find more recent sources on this topic");
    suggestions.push("Create a visual diagram summarizing the key findings");
    suggestions.push("Generate a professional report document from this research");
  } else if (lower.includes("code") || lower.includes("build") || lower.includes("create") || lower.includes("script")) {
    suggestions.push("Add tests and error handling to this code");
    suggestions.push("Create documentation for this project");
    suggestions.push("Design a UI mockup for this application");
  } else if (lower.includes("slide") || lower.includes("presentation") || lower.includes("pitch")) {
    suggestions.push("Create speaker notes for each slide");
    suggestions.push("Design the visual theme for this presentation");
    suggestions.push("Write a one-page executive summary");
  } else if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) {
    suggestions.push("Generate the HTML/CSS code for this design");
    suggestions.push("Create a component library based on this design system");
    suggestions.push("Build a prototype with React");
  } else {
    suggestions.push("Create a visual diagram of the key concepts");
    suggestions.push("Generate a detailed document from this analysis");
    suggestions.push("Research this topic further with more sources");
  }

  return suggestions.slice(0, 3);
}

// ─── Export ─────────────────────────────────────────────────────────

export function exportRun(state: AgentRunState) {
  let md = `# Agent Run: ${state.task}\n\n`;
  md += `**Date:** ${new Date().toLocaleDateString()}\n`;
  md += `**Steps:** ${state.steps.length}\n\n---\n\n`;

  for (const step of state.steps) {
    md += `## Step ${step.index + 1}\n\n`;
    if (step.text) md += step.text + "\n\n";
    for (const tc of step.toolCalls) {
      md += `### Tool: ${tc.name}\n`;
      md += `**Input:** ${JSON.stringify(tc.args, null, 2)}\n\n`;
      if (tc.result) {
        const data = tc.result as Record<string, unknown>;
        if (typeof data.content === "string") {
          md += `**Output:**\n${data.content.slice(0, 3000)}\n\n`;
        } else {
          md += `**Output:**\n\`\`\`json\n${JSON.stringify(tc.result, null, 2).slice(0, 3000)}\n\`\`\`\n\n`;
        }
      }
      if (tc.error) md += `**Error:** ${tc.error}\n\n`;
    }
    md += "---\n\n";
  }

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agent-run-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Hook ───────────────────────────────────────────────────────────

export interface UseAgentRunnerReturn {
  state: AgentRunState;
  dispatch: React.Dispatch<AgentAction>;
  runAgent: (task: string, mode?: "normal" | "deep") => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useAgentRunner(): UseAgentRunnerReturn {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const runAgent = useCallback(
    async (task: string, mode: "normal" | "deep" = "normal") => {
      if (!task.trim()) return;

      dispatch({ type: "START", task: task.trim() });
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: task.trim(),
            mode: mode === "deep" ? "deep" : undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Request failed" }));
          dispatch({
            type: "ERROR",
            error: err.error || `HTTP ${res.status}`,
          });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          dispatch({ type: "ERROR", error: "No response stream" });
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            const event = parseSSELine(trimmed);
            if (!event) continue;

            switch (event.type) {
              case "text-delta":
                dispatch({ type: "TEXT_DELTA", text: event.text });
                break;
              case "tool-call":
                dispatch({
                  type: "TOOL_CALL",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  args: event.args,
                });
                break;
              case "tool-result":
                dispatch({
                  type: "TOOL_RESULT",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  result: event.result,
                });
                break;
              case "tool-error":
                dispatch({
                  type: "TOOL_ERROR",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  error: event.error,
                });
                break;
              case "step-finish":
                dispatch({
                  type: "STEP_FINISH",
                  stepIndex: event.stepIndex,
                });
                break;
              case "finish":
                dispatch({
                  type: "FINISH",
                  finishReason: event.finishReason,
                  totalSteps: event.totalSteps,
                });
                break;
              case "error":
                dispatch({ type: "ERROR", error: event.error });
                break;
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const event = parseSSELine(buffer.trim());
          if (event && event.type === "finish") {
            dispatch({
              type: "FINISH",
              finishReason: event.finishReason,
              totalSteps: event.totalSteps,
            });
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          dispatch({
            type: "FINISH",
            finishReason: "stopped",
            totalSteps: 0,
          });
        } else {
          dispatch({
            type: "ERROR",
            error: err instanceof Error ? err.message : "Connection error",
          });
        }
      } finally {
        abortRef.current = null;
      }
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return { state, dispatch, runAgent, stop, reset };
}
