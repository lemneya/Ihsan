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
  BrainCircuit,
  FileText,
  MicOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "@/components/layout/AppSidebar";
import AgentExecutionView from "@/components/home/AgentExecutionView";
import { useAppStore, generateId } from "@/lib/store";
import { useAgentRunner, exportRun } from "@/hooks/useAgentRunner";
import { useSocketAgent } from "@/hooks/useSocketAgent";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";
import ConnectorModal from "@/components/connectors/ConnectorModal";
import SkillsModal from "@/components/skills/SkillsModal";
import SlideExecutionView from "@/components/slides/SlideExecutionView";
import { io as socketIO, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

/* ─── Quick action pill data ─────────────────────────────────────── */
const quickActions = [
  { icon: Monitor, label: "Create slides", prompt: "Create a presentation about " },
  { icon: LayoutGrid, label: "Build website", prompt: "Build me a website for " },
  { icon: Cpu, label: "Develop apps", prompt: "Develop an app that " },
  { icon: PenTool, label: "Design", prompt: "Design a UI for " },
];

/* ─── Carousel items (skills widget) ─────────────────────────────── */
const carouselItems = [
  { title: "Create skills", description: "Build custom capabilities", prompt: "I want to create a custom skill for " },
  { title: "Automate workflows", description: "Streamline your processes", prompt: "Automate a workflow that " },
  { title: "Analyze data", description: "Extract insights from data", prompt: "Analyze this dataset and find trends in " },
];

const useWS = process.env.NEXT_PUBLIC_USE_WEBSOCKET === "true";

export default function Home() {
  const router = useRouter();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const addAgentTask = useAppStore((s) => s.addAgentTask);
  const updateAgentTask = useAppStore((s) => s.updateAgentTask);
  const sidebarOffset = useSidebarOffset();
  const sseAgent = useAgentRunner();
  const wsAgent = useSocketAgent();
  const { state, runAgent, stop, reset } = useWS ? wsAgent : sseAgent;
  const [deepMode, setDeepMode] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  // Slide execution state
  const [slideView, setSlideView] = useState<"dashboard" | "slides">("dashboard");
  const [slidePrompt, setSlidePrompt] = useState("");
  const [slideLogs, setSlideLogs] = useState<string[]>([]);
  const [slideSlides, setSlideSlides] = useState<{ title: string; subtitle: string; bullet: string }[]>([]);
  const [slideStatus, setSlideStatus] = useState<"starting" | "generating" | "done" | "idle">("idle");
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskIdRef = useRef<string | null>(null);

  /* ─── Carousel auto-rotate ──────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Socket connection for slide generation ───────────────────── */
  useEffect(() => {
    const socket = socketIO(WS_URL);
    socketRef.current = socket;

    socket.on("slides:state", (data: { status: string }) => {
      if (data.status === "starting") {
        setSlideView("slides");
        setSlideStatus("starting");
        setSlideLogs([]);
        setSlideSlides([]);
      } else if (data.status === "generating") {
        setSlideStatus("generating");
      } else if (data.status === "done") {
        setSlideStatus("done");
      }
    });

    socket.on("slides:log", (data: { message: string }) => {
      setSlideLogs((prev) => [...prev, data.message]);
    });

    socket.on("slides:slide", (data: { content: { title: string; subtitle: string; bullet: string } }) => {
      setSlideSlides((prev) => [...prev, data.content]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /* ─── Trigger slide generation ────────────────────────────────── */
  const handleSlideGenerate = useCallback(
    (prompt: string) => {
      setSlidePrompt(prompt);
      setSlideLogs([]);
      setSlideSlides([]);
      setSlideStatus("idle");
      socketRef.current?.emit("slides:generate", { prompt });
    },
    []
  );

  const handleSlideBack = useCallback(() => {
    setSlideView("dashboard");
    setSlideStatus("idle");
    setSlideLogs([]);
    setSlideSlides([]);
    setSlidePrompt("");
  }, []);

  const handleSlideRegenerate = useCallback(() => {
    if (!slidePrompt) return;
    setSlideLogs([]);
    setSlideSlides([]);
    setSlideStatus("idle");
    socketRef.current?.emit("slides:generate", { prompt: slidePrompt });
  }, [slidePrompt]);

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
      setSelectedFile(null);
      setIsListening(false);
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
    if (inputValue.trim() || selectedFile || isListening) {
      const task = inputValue.trim()
        || (selectedFile ? `Analyze file: ${selectedFile.name}` : "")
        || "(Voice input)";
      handleSubmit(task, deepMode ? "deep" : "normal");
    }
  }, [inputValue, selectedFile, isListening, handleSubmit, deepMode]);

  const handlePillSelect = useCallback((prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const isIdle = state.status === "idle" && slideView === "dashboard";
  const hasInput = inputValue.trim().length > 0 || !!selectedFile || isListening;

  // Slide execution view takes over the full screen
  if (slideView === "slides") {
    return (
      <div className="min-h-screen flex bg-white">
        <AppSidebar />
        <main className={`flex-1 transition-[margin] duration-300 flex flex-col h-screen ${sidebarOffset}`}>
          <SlideExecutionView
            prompt={slidePrompt}
            logs={slideLogs}
            slides={slideSlides}
            status={slideStatus}
            onBack={handleSlideBack}
            onRegenerate={handleSlideRegenerate}
          />
        </main>
      </div>
    );
  }

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
        {state.status === "idle" ? (
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
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* File chip */}
                {selectedFile && (
                  <div className="mx-6 mt-4 mb-0 inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-xs px-3 py-1.5 rounded-lg">
                    <FileText className="h-3 w-3 text-gray-500" />
                    <span className="max-w-[200px] truncate text-gray-700">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening..." : "Assign a task or ask anything"}
                  className={`w-full h-32 p-6 text-lg font-light text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none ${selectedFile ? "pt-3" : ""} ${isListening ? "placeholder-red-400" : ""}`}
                  autoFocus
                />

                {/* Toolbar row */}
                <div className="flex items-center justify-between px-4 pb-4">
                  {/* Left icons */}
                  <div className="flex items-center gap-1">
                    {/* + button opens Connectors modal */}
                    <button
                      onClick={() => setShowConnectors(true)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Add Integration"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {/* Web Search toggle */}
                    <button
                      onClick={() => setIsWebSearch((v) => !v)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isWebSearch
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={isWebSearch ? "Web Search ON" : "Enable Web Search"}
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                    {/* File upload */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedFile
                          ? "text-green-600 bg-green-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={selectedFile ? selectedFile.name : "Attach File"}
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right icons */}
                  <div className="flex items-center gap-1">
                    {/* Deep Reasoning toggle */}
                    <button
                      onClick={() => setDeepMode((d) => !d)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        deepMode
                          ? "text-purple-600 bg-purple-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={
                        deepMode
                          ? "Deep Reasoning ON (10 steps, 5-8 sources)"
                          : "Normal mode (5 steps)"
                      }
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </button>
                    {/* Conversation mode toggle */}
                    <button
                      onClick={() => setIsChatMode((v) => !v)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isChatMode
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={isChatMode ? "Conversation Mode ON" : "Enable Conversation Mode"}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    {/* Voice input toggle */}
                    <button
                      onClick={() => {
                        setIsListening((v) => !v);
                        if (!isListening) setInputValue("");
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isListening
                          ? "text-red-500 bg-red-50 animate-pulse"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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

                {/* Active tools indicator */}
                {(deepMode || isWebSearch || isChatMode || isListening) && (
                  <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
                    {deepMode && (
                      <span className="text-xs text-purple-600 flex items-center gap-1">
                        <BrainCircuit className="h-3 w-3" />
                        Deep Reasoning
                      </span>
                    )}
                    {isWebSearch && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Web Search
                      </span>
                    )}
                    {isChatMode && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Conversation
                      </span>
                    )}
                    {isListening && (
                      <span className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
                        <Mic className="h-3 w-3" />
                        Listening...
                      </span>
                    )}
                  </div>
                )}

                {/* Connect banner */}
                {showBanner && (
                  <div className="mx-3 mb-3 bg-[#F9F9FB] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setShowConnectors(true)}
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                      </div>
                      <span className="text-sm text-gray-500">Connect your tools to Ihsan</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBanner(false);
                      }}
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
                {quickActions.map((action) => {
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

            {/* Bottom carousel widget — clickable skills */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="bg-[#F4F4F5] rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer min-w-[280px] hover:bg-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={() => {
                    const item = carouselItems[carouselIndex];
                    if (item.title === "Create skills") {
                      setShowSkills(true);
                    } else {
                      handlePillSelect(item.prompt);
                    }
                  }}
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
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400">
                    <ArrowUp className="h-4 w-4 rotate-45" />
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

      <ConnectorModal
        isOpen={showConnectors}
        onClose={() => setShowConnectors(false)}
      />
      <SkillsModal
        isOpen={showSkills}
        onClose={() => setShowSkills(false)}
      />
    </div>
  );
}
