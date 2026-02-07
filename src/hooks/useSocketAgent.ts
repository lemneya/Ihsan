"use client";

import { useReducer, useRef, useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { agentReducer, initialState } from "@/lib/agent-reducer";
import type { AgentAction } from "@/lib/agent-types";
import type { UseAgentRunnerReturn } from "./useAgentRunner";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export function useSocketAgent(): UseAgentRunnerReturn {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const socketRef = useRef<Socket | null>(null);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    // Map socket events to reducer actions
    socket.on("agent:text-delta", (data: { text: string }) => {
      dispatch({ type: "TEXT_DELTA", text: data.text });
    });

    socket.on(
      "agent:tool-call",
      (data: { toolCallId: string; toolName: string; args: Record<string, unknown> }) => {
        dispatch({
          type: "TOOL_CALL",
          toolCallId: data.toolCallId,
          toolName: data.toolName,
          args: data.args,
        });
      }
    );

    socket.on(
      "agent:tool-result",
      (data: { toolCallId: string; toolName: string; result: unknown }) => {
        dispatch({
          type: "TOOL_RESULT",
          toolCallId: data.toolCallId,
          toolName: data.toolName,
          result: data.result,
        });
      }
    );

    socket.on(
      "agent:tool-error",
      (data: { toolCallId: string; toolName: string; error: string }) => {
        dispatch({
          type: "TOOL_ERROR",
          toolCallId: data.toolCallId,
          toolName: data.toolName,
          error: data.error,
        });
      }
    );

    socket.on("agent:step-finish", (data: { stepIndex: number }) => {
      dispatch({ type: "STEP_FINISH", stepIndex: data.stepIndex });
    });

    socket.on(
      "agent:finish",
      (data: { finishReason: string; totalSteps: number }) => {
        dispatch({
          type: "FINISH",
          finishReason: data.finishReason,
          totalSteps: data.totalSteps,
        });
      }
    );

    socket.on("agent:error", (data: { error: string }) => {
      dispatch({ type: "ERROR", error: data.error });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const runAgent = useCallback(
    async (task: string, mode: "normal" | "deep" = "normal") => {
      if (!task.trim()) return;
      dispatch({ type: "START", task: task.trim() });
      socketRef.current?.emit("agent:start", {
        task: task.trim(),
        mode: mode === "deep" ? "deep" : undefined,
      });
    },
    []
  );

  const stop = useCallback(() => {
    socketRef.current?.emit("agent:stop");
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return { state, dispatch, runAgent, stop, reset };
}
