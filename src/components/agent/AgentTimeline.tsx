"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  Search,
  Globe,
  Code,
  FileDown,
  GitBranch,
  Presentation,
  FileText,
  Palette,
  Sheet,
  Image,
  Music,
  Video,
} from "lucide-react";
import type { AgentStep, ToolCallState } from "@/lib/agent-types";

// ─── Step Timer ──────────────────────────────────────────────────────

function StepTimer({
  startedAt,
  completedAt,
}: {
  startedAt?: number;
  completedAt?: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (completedAt || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, completedAt]);

  if (!startedAt) return null;

  const elapsed = Math.floor(((completedAt || now) - startedAt) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <span className="text-xs font-mono text-muted-foreground tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

// ─── Step Name Derivation ────────────────────────────────────────────

const toolStepNames: Record<string, string> = {
  web_search: "Research and gather information",
  web_fetch: "Browse and read sources",
  run_javascript: "Execute code",
  create_artifact: "Create file",
  create_diagram: "Create visualization",
  generate_slides: "Generate presentation",
  generate_document: "Create document",
  generate_code: "Generate code",
  generate_design: "Create design",
  generate_spreadsheet: "Create spreadsheet",
  generate_image_prompts: "Generate image prompts",
  generate_music: "Compose music",
  generate_video_script: "Create video script",
};

const toolIcons: Record<string, React.ElementType> = {
  web_search: Search,
  web_fetch: Globe,
  run_javascript: Code,
  create_artifact: FileDown,
  create_diagram: GitBranch,
  generate_slides: Presentation,
  generate_document: FileText,
  generate_code: Code,
  generate_design: Palette,
  generate_spreadsheet: Sheet,
  generate_image_prompts: Image,
  generate_music: Music,
  generate_video_script: Video,
};

function deriveStepName(step: AgentStep): string {
  // Try to get name from step text — first sentence
  if (step.text) {
    const sentences = step.text.split(/[.!?\n]/);
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length >= 15 && trimmed.length <= 80) {
        return trimmed;
      }
      if (trimmed.length > 80) {
        return trimmed.slice(0, 75).replace(/\s+\S*$/, "") + "...";
      }
    }
  }

  // Derive from tool calls
  if (step.toolCalls.length > 0) {
    const primaryTool = step.toolCalls[0].name;
    return toolStepNames[primaryTool] || `Process step ${step.index + 1}`;
  }

  return `Step ${step.index + 1}`;
}

// ─── Tool Pill (compact inline for timeline) ─────────────────────────

const pillColors: Record<string, string> = {
  web_search: "text-amber-600 dark:text-amber-400",
  web_fetch: "text-emerald-600 dark:text-emerald-400",
  run_javascript: "text-purple-600 dark:text-purple-400",
  create_artifact: "text-orange-600 dark:text-orange-400",
  create_diagram: "text-cyan-600 dark:text-cyan-400",
  generate_slides: "text-red-600 dark:text-red-400",
  generate_document: "text-blue-600 dark:text-blue-400",
  generate_code: "text-purple-600 dark:text-purple-400",
  generate_design: "text-pink-600 dark:text-pink-400",
  generate_spreadsheet: "text-green-600 dark:text-green-400",
  generate_image_prompts: "text-teal-600 dark:text-teal-400",
  generate_music: "text-orange-600 dark:text-orange-400",
  generate_video_script: "text-rose-600 dark:text-rose-400",
};

function pillLabel(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "web_search":
      return `Search for ${String(args.query || "information").slice(0, 60)}`;
    case "web_fetch": {
      try {
        const hostname = new URL(String(args.url || "")).hostname.replace("www.", "");
        return `Open ${hostname}`;
      } catch {
        return "Fetch web page";
      }
    }
    case "run_javascript":
      return "Run JavaScript code";
    case "create_artifact":
      return `Create ${String(args.title || "file")}`;
    case "create_diagram":
      return `Create diagram: ${String(args.title || "visualization")}`;
    case "generate_slides":
      return `Build presentation about ${String(args.topic || "topic").slice(0, 50)}`;
    case "generate_document":
      return `Write document: ${String(args.brief || "").slice(0, 50)}`;
    case "generate_code":
      return `Generate code: ${String(args.spec || "").slice(0, 50)}`;
    case "generate_design":
      return `Design: ${String(args.brief || "").slice(0, 50)}`;
    case "generate_spreadsheet":
      return `Create spreadsheet: ${String(args.request || "").slice(0, 50)}`;
    case "generate_image_prompts":
      return `Craft image prompts: ${String(args.description || "").slice(0, 50)}`;
    case "generate_music":
      return `Compose: ${String(args.request || "").slice(0, 50)}`;
    case "generate_video_script":
      return `Script video: ${String(args.concept || "").slice(0, 50)}`;
    default:
      return name.replace(/_/g, " ");
  }
}

function ToolPill({ tc }: { tc: ToolCallState }) {
  const Icon = toolIcons[tc.name] || Code;
  const color = pillColors[tc.name] || "text-gray-500";

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      {tc.status === "executing" ? (
        <Loader2 className={`h-3.5 w-3.5 ${color} animate-spin flex-shrink-0`} />
      ) : tc.status === "done" ? (
        <Icon className={`h-3.5 w-3.5 ${color} flex-shrink-0`} />
      ) : (
        <Icon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
      )}
      <span className="text-foreground/80 truncate">{pillLabel(tc.name, tc.args)}</span>
    </div>
  );
}

// ─── Step Group ──────────────────────────────────────────────────────

type StepStatus = "active" | "completed" | "pending";

function getStepStatus(step: AgentStep, isLast: boolean, runCompleted: boolean): StepStatus {
  if (step.completedAt) return "completed";
  if (isLast && !runCompleted) return "active";
  return "pending";
}

function StepGroup({
  step,
  status,
  defaultExpanded,
  hideText,
}: {
  step: AgentStep;
  status: StepStatus;
  defaultExpanded: boolean;
  hideText: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const stepName = deriveStepName(step);

  // Auto-expand active step
  useEffect(() => {
    if (status === "active") setExpanded(true);
  }, [status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative"
    >
      {/* Step Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 py-2 text-left group cursor-pointer"
      >
        {/* Status icon */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {status === "active" ? (
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-violet-500 animate-ping opacity-40" />
            </div>
          ) : status === "completed" ? (
            <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="h-2.5 w-2.5 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>

        {/* Step name */}
        <span
          className={`text-sm font-medium flex-1 truncate ${
            status === "active"
              ? "text-foreground"
              : "text-foreground/70"
          }`}
        >
          {stepName}
        </span>

        {/* Timer */}
        <StepTimer startedAt={step.startedAt} completedAt={step.completedAt} />

        {/* Chevron */}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Step Body (collapsible) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-7 pb-3 space-y-1.5">
              {/* Thinking text */}
              {!hideText && step.text && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.text}
                </p>
              )}

              {/* Tool calls as pills */}
              {step.toolCalls.length > 0 && (
                <div className="space-y-0.5">
                  {step.toolCalls.map((tc) => (
                    <ToolPill key={tc.id} tc={tc} />
                  ))}
                </div>
              )}

              {/* Active thinking indicator */}
              {status === "active" &&
                step.toolCalls.every((tc) => tc.status !== "executing") &&
                !step.text && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-violet-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                    Thinking
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────

interface AgentTimelineProps {
  steps: AgentStep[];
  hideLastStepText?: boolean;
  runCompleted?: boolean;
}

export default function AgentTimeline({
  steps,
  hideLastStepText,
  runCompleted = false,
}: AgentTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps]);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {/* Vertical timeline line */}
      <div className="relative">
        {/* Subtle left line */}
        <div className="absolute left-[9px] top-4 bottom-4 w-px bg-border" />

        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const status = getStepStatus(step, isLast, runCompleted);

          return (
            <StepGroup
              key={step.index}
              step={step}
              status={status}
              defaultExpanded={status === "active" || (isLast && !runCompleted)}
              hideText={hideLastStepText === true && isLast}
            />
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
