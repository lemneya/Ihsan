"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  Globe,
  Paperclip,
  MessageSquare,
  Mic,
  ArrowUp,
  Monitor,
  LayoutGrid,
  Cpu,
  PenTool,
  ChevronDown,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "@/components/layout/AppSidebar";
import AgentExecutionView from "@/components/home/AgentExecutionView";
import { useAppStore, generateId } from "@/lib/store";
import { useAgentRunner, exportRun } from "@/hooks/useAgentRunner";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";
import toast from "react-hot-toast";

/* ─── Quick action pill data ─────────────────────────────────────── */
const quickActions = [
  { icon: Monitor, label: "Create slides", prompt: "Create a presentation about " },
  { icon: LayoutGrid, label: "Build website", prompt: "Build me a website for " },
  { icon: Cpu, label: "Develop apps", prompt: "Develop an app that " },
  { icon: PenTool, label: "Design", prompt: "Design a UI for " },
];

/* ─── Carousel items ─────────────────────────────────────────────── */
const carouselItems = [
  { title: "Create skills", description: "Build custom capabilities" },
  { title: "Automate workflows", description: "Streamline your processes" },
  { title: "Analyze data", description: "Extract insights from data" },
];

export default function Home() {
  const router = useRouter();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const addAgentTask = useAppStore((s) => s.addAgentTask);
  const updateAgentTask = useAppStore((s) => s.updateAgentTask);
  const sidebarOffset = useSidebarOffset();
  const { state, runAgent, stop, reset } = useAgentRunner();
  const [deepMode, setDeepMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const taskIdRef = useRef<string | null>(null);

  /* ─── Carousel auto-rotate ──────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Submit handler ────────────────────────────────────────────── */
  const handleSubmit = useCallback(
    async (task: string, mode: "normal" | "deep" = "normal") => {
      if (!task.trim()) return;

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
      setInputValue("");
      await runAgent(task.trim(), mode);
    },
    [addAgentTask, runAgent]
  );

  /* ─── Sync store on completion ──────────────────────────────────── */
  useEffect(() => {
    const id = taskIdRef.current;
    if (!id) return;

    if (state.status === "completed" || state.status === "error") {
      updateAgentTask(id, {
        status: state.status,
        stepsCount: state.steps.length,
        runState: state,
      });
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (inputValue.trim()) {
          handleSubmit(inputValue.trim(), deepMode ? "deep" : "normal");
        }
      }
    },
    [inputValue, handleSubmit, deepMode]
  );

  const handleSubmitClick = useCallback(() => {
    if (inputValue.trim()) {
      handleSubmit(inputValue.trim(), deepMode ? "deep" : "normal");
    }
  }, [inputValue, handleSubmit, deepMode]);

  const handlePillSelect = useCallback((prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  }, []);

  const isIdle = state.status === "idle";
  const hasInput = inputValue.trim().length > 0;

  return (
    <div className="min-h-screen flex bg-white">
      <AppSidebar />

      <main className={`flex-1 transition-[margin] duration-300 flex flex-col h-screen ${sidebarOffset}`}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => toast("Authentication coming soon", { icon: "🔐" })}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => toast("Authentication coming soon", { icon: "🔐" })}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Content */}
        {isIdle ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative">
            <div className="w-full max-w-2xl space-y-6 -mt-16">
              {/* Hero text */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl font-serif tracking-tight text-center text-gray-900"
              >
                What can I do for you?
              </motion.h1>

              {/* Large rounded input box */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className={`rounded-[32px] border transition-all duration-300 overflow-hidden ${
                  hasInput
                    ? "border-blue-200 shadow-[0_8px_30px_rgba(59,130,246,0.08)] bg-gradient-to-b from-blue-50/30 to-white"
                    : "border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                }`}
              >
                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Assign a task or ask anything"
                  className="w-full h-32 p-6 text-lg font-light text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none"
                  autoFocus
                />

                {/* Toolbar row */}
                <div className="flex items-center justify-between px-4 pb-4">
                  {/* Left icons */}
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                      <Globe className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right icons */}
                  <div className="flex items-center gap-1">
                    {/* Deep mode toggle */}
                    <button
                      onClick={() => setDeepMode((d) => !d)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        deepMode
                          ? "bg-amber-500 text-white shadow-md"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={
                        deepMode
                          ? "Deep Research ON (10 steps, 5-8 sources)"
                          : "Normal mode (5 steps)"
                      }
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                      <Mic className="h-4 w-4" />
                    </button>
                    {/* Submit button */}
                    <motion.button
                      onClick={handleSubmitClick}
                      whileTap={{ scale: 0.92 }}
                      disabled={!hasInput}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        hasInput
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Deep mode indicator */}
                {deepMode && (
                  <div className="px-6 pb-3">
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Deep Research — 10 steps, 5-8 sources, comprehensive report
                    </p>
                  </div>
                )}

                {/* Connect banner */}
                {showBanner && (
                  <div className="mx-3 mb-3 bg-[#F9F9FB] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                      </div>
                      <span className="text-sm text-gray-500">Connect your tools to Ihsan</span>
                    </div>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Quick action pills */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handlePillSelect(action.prompt)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all cursor-pointer bg-white"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowMoreActions((s) => !s)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all cursor-pointer bg-white"
                >
                  More
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showMoreActions ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showMoreActions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full flex flex-wrap gap-2 justify-center overflow-hidden"
                    >
                      {[
                        { label: "Write document", prompt: "Write a professional document about " },
                        { label: "Generate code", prompt: "Write code to " },
                        { label: "Research", prompt: "Research and write a report about " },
                        { label: "Spreadsheet", prompt: "Create a spreadsheet with " },
                      ].map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handlePillSelect(action.prompt)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all cursor-pointer bg-white"
                        >
                          {action.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Bottom carousel widget */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="bg-[#F4F4F5] rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer min-w-[280px]"
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselItems.length)}
                >
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={carouselIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {carouselItems[carouselIndex].title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {carouselItems[carouselIndex].description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Skeleton bars */}
                  <div className="flex flex-col gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-gray-200" />
                    <div className="w-12 h-2 rounded-full bg-gray-200" />
                    <div className="w-14 h-2 rounded-full bg-gray-200" />
                  </div>
                </div>

                {/* Pagination dots */}
                <div className="flex items-center gap-1.5">
                  {carouselItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                        i === carouselIndex ? "bg-gray-900 w-3" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
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
