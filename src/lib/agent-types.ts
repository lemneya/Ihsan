/** Events streamed from the agent API endpoint via SSE */
export type AgentEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: "tool-result"; toolCallId: string; toolName: string; result: unknown }
  | { type: "tool-error"; toolCallId: string; toolName: string; error: string }
  | { type: "step-finish"; stepIndex: number }
  | { type: "finish"; finishReason: string; totalSteps: number }
  | { type: "error"; error: string };

/** Status of an individual tool call */
export type ToolCallStatus = "executing" | "done" | "error";

/** State for a single tool call within a step */
export interface ToolCallState {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: ToolCallStatus;
}

/** A single agent step (one LLM round) containing text and tool calls */
export interface AgentStep {
  index: number;
  text: string;
  toolCalls: ToolCallState[];
  startedAt?: number;
  completedAt?: number;
}

/** Overall run status */
export type AgentRunStatus = "idle" | "running" | "completed" | "error";

/** Full state of an agent run, managed by useReducer */
export interface AgentRunState {
  status: AgentRunStatus;
  task: string;
  steps: AgentStep[];
  currentText: string;
  error?: string;
  finishReason?: string;
}

/** Actions dispatched to the agent state reducer */
export type AgentAction =
  | { type: "START"; task: string }
  | { type: "TEXT_DELTA"; text: string }
  | { type: "TOOL_CALL"; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: "TOOL_RESULT"; toolCallId: string; toolName: string; result: unknown }
  | { type: "TOOL_ERROR"; toolCallId: string; toolName: string; error: string }
  | { type: "STEP_FINISH"; stepIndex: number }
  | { type: "FINISH"; finishReason: string; totalSteps: number }
  | { type: "ERROR"; error: string }
  | { type: "RESET" }
  | { type: "LOAD"; runState: AgentRunState };
