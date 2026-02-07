"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bot, ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import AgentExecutionView from "@/components/home/AgentExecutionView";
import { useAppStore } from "@/lib/store";
import { useAgentRunner, generateFollowUps, exportRun } from "@/hooks/useAgentRunner";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const getAgentTask = useAppStore((s) => s.getAgentTask);
  const sidebarOffset = useSidebarOffset();
  const { state, dispatch, runAgent, stop, reset } = useAgentRunner();
  const [deepMode, setDeepMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from store
  useEffect(() => {
    const task = getAgentTask(id);
    if (task && !hydrated) {
      dispatch({ type: "LOAD", runState: task.runState });
      setDeepMode(task.mode === "deep");
      setHydrated(true);
    }
  }, [id, getAgentTask, dispatch, hydrated]);

  const storedTask = getAgentTask(id);

  if (!storedTask && !hydrated) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className={`flex-1 transition-[margin] duration-300 ${sidebarOffset}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-4">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
              <h2 className="text-lg font-semibold text-foreground">Task not found</h2>
              <p className="text-sm text-muted-foreground">
                This task may have been deleted or doesn&apos;t exist.
              </p>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleFollowUp = (suggestion: string) => {
    reset();
    setTimeout(() => runAgent(suggestion, deepMode ? "deep" : "normal"), 50);
  };

  const handleReset = () => {
    reset();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className={`flex-1 transition-[margin] duration-300 flex flex-col h-screen ${sidebarOffset}`}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </button>
        </div>

        {/* Agent execution view */}
        <AgentExecutionView
          state={state}
          deepMode={deepMode}
          onStop={stop}
          onReset={handleReset}
          onFollowUp={handleFollowUp}
          onExport={() => exportRun(state)}
        />
      </main>
    </div>
  );
}
