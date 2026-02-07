"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  Bot,
  Send,
  Zap,
  Clock,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import ToolLayout from "@/components/layout/ToolLayout";
import AgentExecutionView from "@/components/home/AgentExecutionView";
import { useAgentRunner, generateFollowUps, exportRun } from "@/hooks/useAgentRunner";

// ─── Session History ────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  task: string;
  mode: "normal" | "deep";
  timestamp: number;
  stepsCount: number;
  finalAnswer: string;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("ihsan-agent-history") || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry: HistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(
    "ihsan-agent-history",
    JSON.stringify(history.slice(0, 20))
  );
}

function clearHistory() {
  localStorage.removeItem("ihsan-agent-history");
}

// ─── Examples (showcasing Ihsan tool integration) ───────────────────

const examples = [
  "Create a pitch deck about my AI startup idea",
  "Research the latest AI developments and write a report",
  "Build me a landing page with React and Tailwind",
  "Design a mobile app UI for a fitness tracker",
  "Compare React, Vue, and Svelte with a diagram",
  "Write a Python script and create a spreadsheet of test data",
];

// ─── Component ──────────────────────────────────────────────────────

export default function AgentPage() {
  const { state, runAgent, stop, reset } = useAgentRunner();
  const [deepMode, setDeepMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleRunAgent = useCallback(
    async (task: string, mode: "normal" | "deep" = deepMode ? "deep" : "normal") => {
      await runAgent(task, mode);
    },
    [deepMode, runAgent]
  );

  const handleSubmit = useCallback(() => {
    const task = inputRef.current?.value || "";
    if (task.trim() && state.status !== "running") {
      handleRunAgent(task);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [handleRunAgent, state.status]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleReset = useCallback(() => {
    reset();
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [reset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Final answer + save to history on completion
  const finalAnswer =
    state.status === "completed"
      ? state.steps
          .filter((s) => s.text.trim())
          .map((s) => s.text)
          .pop() || ""
      : "";

  // Save to history when completed
  useEffect(() => {
    if (state.status === "completed" && finalAnswer) {
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        task: state.task,
        mode: deepMode ? "deep" : "normal",
        timestamp: Date.now(),
        stepsCount: state.steps.length,
        finalAnswer: finalAnswer.slice(0, 500),
      };
      saveToHistory(entry);
      setHistory(loadHistory());
    }
  }, [state.status, state.task, state.steps.length, finalAnswer, deepMode]);

  return (
    <ToolLayout
      title="AI Agent"
      icon={<Bot className="h-5 w-5" />}
      iconColor="bg-violet-50 text-violet-500 dark:bg-violet-950 dark:text-violet-400"
    >
      <div className="flex-1 flex flex-col h-full">
        {/* ─── Idle: Task input + examples ─── */}
        {state.status === "idle" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
              {/* Hero */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-100 dark:bg-violet-950 mx-auto"
                >
                  <Bot className="h-8 w-8 text-violet-500" />
                </motion.div>
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-foreground"
                >
                  Ihsan Agent
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-muted-foreground text-sm max-w-lg mx-auto"
                >
                  Your autonomous AI that can search the web, run code, create
                  diagrams, and orchestrate all Ihsan tools — slides, docs,
                  code, design, sheets, music, video — to accomplish any task.
                </motion.p>
              </div>

              {/* Input */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your task..."
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 pr-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    autoFocus
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    {/* Deep Research Toggle */}
                    <button
                      onClick={() => setDeepMode((d) => !d)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        deepMode
                          ? "bg-amber-500 text-white shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      title={
                        deepMode
                          ? "Deep Research ON (10 steps, 5-8 sources)"
                          : "Normal mode (5 steps)"
                      }
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="p-2 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-colors cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {deepMode && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 ml-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Deep Research — 10 steps, 5-8 sources, comprehensive report
                  </p>
                )}
              </motion.div>

              {/* Examples */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      if (inputRef.current) inputRef.current.value = ex;
                      handleRunAgent(ex);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </motion.div>

              {/* History */}
              {history.length > 0 && (
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={() => setShowHistory((s) => !s)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto cursor-pointer"
                  >
                    <Clock className="h-3 w-3" />
                    {showHistory ? "Hide" : "Show"} recent tasks ({history.length})
                  </button>

                  {showHistory && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {history.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => handleRunAgent(entry.task, entry.mode)}
                          className="w-full text-left px-3 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-foreground truncate flex-1">
                              {entry.task}
                            </p>
                            {entry.mode === "deep" && (
                              <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(entry.timestamp).toLocaleDateString()} — {entry.stepsCount} steps
                          </p>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          clearHistory();
                          setHistory([]);
                        }}
                        className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 mx-auto cursor-pointer"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Clear history
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ─── Running / Completed / Error — use shared AgentExecutionView ─── */}
        {state.status !== "idle" && (
          <AgentExecutionView
            state={state}
            deepMode={deepMode}
            onStop={handleStop}
            onReset={handleReset}
            onFollowUp={(suggestion) => {
              reset();
              setTimeout(() => handleRunAgent(suggestion), 50);
            }}
            onExport={() => exportRun(state)}
          />
        )}
      </div>
    </ToolLayout>
  );
}
