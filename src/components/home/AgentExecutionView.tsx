"use client";

import {
  Bot,
  Square,
  RotateCcw,
  Download,
  ArrowRight,
  Zap,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentTimeline from "@/components/agent/AgentTimeline";
import LiveActivityPanel from "@/components/agent/LiveActivityPanel";
import SlidePreview from "@/components/agent/SlidePreview";
import CodeBlock from "@/components/chat/CodeBlock";
import ErrorMessage from "@/components/chat/ErrorMessage";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { generateFollowUps } from "@/hooks/useAgentRunner";
import type { AgentRunState } from "@/lib/agent-types";

interface AgentExecutionViewProps {
  state: AgentRunState;
  deepMode: boolean;
  onStop: () => void;
  onReset: () => void;
  onFollowUp: (suggestion: string) => void;
  onExport: () => void;
}

/** Scan steps for a completed generate_slides tool call and return its markdown content */
function findSlideResult(state: AgentRunState): string | null {
  for (const step of state.steps) {
    for (const tc of step.toolCalls) {
      if (
        tc.name === "generate_slides" &&
        tc.status === "done" &&
        typeof tc.result === "object" &&
        tc.result !== null
      ) {
        const content = (tc.result as Record<string, unknown>).content;
        if (typeof content === "string") return content;
      }
    }
  }
  return null;
}

export default function AgentExecutionView({
  state,
  deepMode,
  onStop,
  onReset,
  onFollowUp,
  onExport,
}: AgentExecutionViewProps) {
  const elapsed = useElapsedTimer(state.status === "running");
  const isRunning = state.status === "running";
  const isCompleted = state.status === "completed";

  const finalAnswer = isCompleted
    ? state.steps
        .filter((s) => s.text.trim())
        .map((s) => s.text)
        .pop() || ""
    : "";

  const followUps =
    isCompleted && finalAnswer
      ? generateFollowUps(state.task, finalAnswer)
      : [];

  const slideMarkdown = findSlideResult(state);

  // Determine if right panel should show
  const showRightPanel = isRunning || slideMarkdown;

  // Main content (left pane: timeline + final answer)
  const mainContent = (
    <div className={`${showRightPanel ? "" : "max-w-3xl mx-auto"} px-4 sm:px-6 py-6 space-y-6`}>
      {/* Task header */}
      <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-2xl px-4 py-3">
        <Bot className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-0.5">
              Task
            </p>
            {deepMode && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" /> Deep
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{state.task}</p>
        </div>
        {/* Elapsed timer */}
        {isRunning && (
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-mono font-medium">{elapsed}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <AgentTimeline
        steps={state.steps}
        hideLastStepText={isCompleted}
        runCompleted={isCompleted}
      />

      {/* Error */}
      {state.status === "error" && state.error && (
        <ErrorMessage
          error={state.error}
          onRetry={() => onFollowUp(state.task)}
        />
      )}

      {/* Completed: final answer */}
      {isCompleted && finalAnswer && (
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-500" />
              Final Answer
            </h3>
            <button
              onClick={onExport}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Export as Markdown"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");
                  if (match) {
                    return <CodeBlock language={match[1]}>{codeStr}</CodeBlock>;
                  }
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[0.8125rem]" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {finalAnswer}
            </ReactMarkdown>
          </div>

          {/* Follow-up Suggestions */}
          {followUps.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Continue exploring
              </p>
              <div className="flex flex-col gap-1.5">
                {followUps.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onFollowUp(suggestion)}
                    className="flex items-center gap-2 text-xs text-left px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-violet-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Determine right panel content
  const rightPanel = slideMarkdown ? (
    <SlidePreview markdown={slideMarkdown} title={state.task.slice(0, 80)} />
  ) : isRunning ? (
    <LiveActivityPanel state={state} />
  ) : null;

  return (
    <>
      <div className="flex-1 overflow-hidden">
        {showRightPanel ? (
          /* Split-pane layout */
          <div className="flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 overflow-y-auto">{mainContent}</div>
            <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-border overflow-hidden">
              {rightPanel}
            </div>
          </div>
        ) : (
          /* Single-column layout */
          <div className="overflow-y-auto h-full">{mainContent}</div>
        )}
      </div>

      {/* Bottom bar with step counter */}
      <div className="border-t border-border px-4 sm:px-6 py-3 flex items-center gap-3 justify-between">
        {/* Step progress */}
        <div className="flex items-center gap-3">
          {state.steps.length > 0 && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-violet-500 animate-pulse" : isCompleted ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs text-muted-foreground font-medium">
                Step {state.steps.filter(s => s.completedAt).length + (isRunning ? 1 : 0)} / {state.steps.length}
              </span>
              {isRunning && (
                <span className="text-xs text-muted-foreground">
                  — {state.steps[state.steps.length - 1]?.toolCalls.some(tc => tc.status === "executing") ? "Executing" : "Thinking"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
          )}
          {(isCompleted || state.status === "error") && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Task
            </button>
          )}
        </div>
      </div>
    </>
  );
}
