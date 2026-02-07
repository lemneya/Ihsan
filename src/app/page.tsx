"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import HeroSection from "@/components/home/HeroSection";
import AgentExecutionView from "@/components/home/AgentExecutionView";
import { useAppStore, generateId } from "@/lib/store";
import { useAgentRunner, exportRun } from "@/hooks/useAgentRunner";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const addAgentTask = useAppStore((s) => s.addAgentTask);
  const updateAgentTask = useAppStore((s) => s.updateAgentTask);
  const sidebarOffset = useSidebarOffset();
  const { state, runAgent, stop, reset } = useAgentRunner();
  const [deepMode, setDeepMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const taskIdRef = useRef<string | null>(null);

  const handleSubmit = useCallback(
    async (task: string, mode: "normal" | "deep" = "normal") => {
      if (!task.trim()) return;

      // Create task in store
      const id = generateId();
      taskIdRef.current = id;
      const agentTask = {
        id,
        title: task.trim().slice(0, 60),
        task: task.trim(),
        createdAt: Date.now(),
        mode,
        status: "running" as const,
        stepsCount: 0,
        runState: {
          status: "running" as const,
          task: task.trim(),
          steps: [{ index: 0, text: "", toolCalls: [] }],
          currentText: "",
        },
      };
      addAgentTask(agentTask);

      // Run agent in-place (don't navigate — that would unmount and kill the SSE stream)
      await runAgent(task.trim(), mode);
    },
    [addAgentTask, runAgent]
  );

  // Update store when agent state changes, navigate to task page on completion
  useEffect(() => {
    const id = taskIdRef.current;
    if (!id) return;

    if (state.status === "completed" || state.status === "error") {
      updateAgentTask(id, {
        status: state.status,
        stepsCount: state.steps.length,
        runState: state,
      });
      // Now safe to update URL (agent is done, no SSE to kill)
      window.history.replaceState(null, "", `/task/${id}`);
    }
  }, [state, updateAgentTask, router]);

  const handleFollowUp = useCallback(
    (suggestion: string) => {
      reset();
      taskIdRef.current = null;
      setTimeout(() => handleSubmit(suggestion, deepMode ? "deep" : "normal"), 50);
    },
    [reset, handleSubmit, deepMode]
  );

  const handleReset = useCallback(() => {
    reset();
    taskIdRef.current = null;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [reset]);

  const isIdle = state.status === "idle";

  return (
    <div className="min-h-screen flex">
      <AppSidebar />

      <main className={`flex-1 transition-[margin] duration-300 flex flex-col h-screen ${sidebarOffset}`}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => toast("Authentication coming soon", { icon: "🔐" })}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => toast("Authentication coming soon", { icon: "🔐" })}
              className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Content: Idle → Hero, Active → Execution View */}
        {isIdle ? (
          <HeroSection
            onSubmit={handleSubmit}
            deepMode={deepMode}
            onDeepModeToggle={() => setDeepMode((d) => !d)}
            inputRef={inputRef}
          />
        ) : (
          <AgentExecutionView
            state={state}
            deepMode={deepMode}
            onStop={stop}
            onReset={handleReset}
            onFollowUp={handleFollowUp}
            onExport={() => exportRun(state)}
          />
        )}
      </main>
    </div>
  );
}
