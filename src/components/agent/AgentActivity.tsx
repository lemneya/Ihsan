"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Brain,
  Pencil,
} from "lucide-react";
import type { AgentStep } from "@/lib/agent-types";

const toolActivity: Record<
  string,
  { icon: React.ElementType; verb: string; color: string }
> = {
  web_search: { icon: Search, verb: "Searching the web", color: "text-blue-500" },
  web_fetch: { icon: Globe, verb: "Reading page", color: "text-emerald-500" },
  run_javascript: { icon: Code, verb: "Running code", color: "text-purple-500" },
  create_artifact: { icon: FileDown, verb: "Creating file", color: "text-orange-500" },
  create_diagram: { icon: GitBranch, verb: "Drawing diagram", color: "text-cyan-500" },
  generate_slides: { icon: Presentation, verb: "Building presentation", color: "text-red-500" },
  generate_document: { icon: FileText, verb: "Writing document", color: "text-blue-500" },
  generate_code: { icon: Code, verb: "Generating code", color: "text-purple-500" },
  generate_design: { icon: Palette, verb: "Designing", color: "text-pink-500" },
  generate_spreadsheet: { icon: Sheet, verb: "Creating spreadsheet", color: "text-green-500" },
  generate_image_prompts: { icon: Image, verb: "Crafting image prompts", color: "text-teal-500" },
  generate_music: { icon: Music, verb: "Composing music", color: "text-orange-500" },
  generate_video_script: { icon: Video, verb: "Scripting video", color: "text-rose-500" },
};

function getToolDetail(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "web_search":
      return `"${String(args.query || "").slice(0, 50)}"`;
    case "web_fetch": {
      const url = String(args.url || "");
      try {
        return new URL(url).hostname;
      } catch {
        return url.slice(0, 40);
      }
    }
    case "run_javascript":
      return "sandbox";
    case "create_artifact":
      return String(args.title || "file");
    case "create_diagram":
      return String(args.title || "diagram");
    case "generate_slides":
      return String(args.topic || "").slice(0, 40);
    case "generate_document":
      return String(args.brief || "").slice(0, 40);
    case "generate_code":
      return String(args.spec || "").slice(0, 40);
    case "generate_design":
      return String(args.brief || "").slice(0, 40);
    case "generate_spreadsheet":
      return String(args.request || "").slice(0, 40);
    case "generate_image_prompts":
      return String(args.description || "").slice(0, 40);
    case "generate_music":
      return String(args.request || "").slice(0, 40);
    case "generate_video_script":
      return String(args.concept || "").slice(0, 40);
    default:
      return "";
  }
}

interface CompletedAction {
  key: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

interface AgentActivityProps {
  steps: AgentStep[];
  isRunning: boolean;
}

export default function AgentActivity({ steps, isRunning }: AgentActivityProps) {
  // Derive current state from steps
  const { currentAction, completedActions, isWriting } = useMemo(() => {
    const completed: CompletedAction[] = [];
    let current: {
      icon: React.ElementType;
      verb: string;
      detail: string;
      color: string;
    } | null = null;
    let writing = false;

    for (const step of steps) {
      for (const tc of step.toolCalls) {
        const meta = toolActivity[tc.name];
        if (!meta) continue;

        if (tc.status === "executing") {
          current = {
            icon: meta.icon,
            verb: meta.verb,
            detail: getToolDetail(tc.name, tc.args),
            color: meta.color,
          };
        } else {
          completed.push({
            key: tc.id,
            icon: meta.icon,
            label: meta.verb.split(" ").pop() || meta.verb,
            color: meta.color,
          });
        }
      }

      // If the last step has text being generated and no active tool call
      if (step === steps[steps.length - 1] && step.text.length > 0 && !current) {
        writing = true;
      }
    }

    return { currentAction: current, completedActions: completed, isWriting: writing };
  }, [steps]);

  if (!isRunning) return null;

  return (
    <div className="space-y-3">
      {/* Completed actions trail */}
      {completedActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {completedActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-medium"
                >
                  <Icon className={`h-2.5 w-2.5 ${action.color}`} />
                  {action.label}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Current action */}
      <AnimatePresence mode="wait">
        {currentAction && (
          <motion.div
            key="tool-action"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                className={`absolute inset-0 rounded-full ${currentAction.color} opacity-20`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 28, height: 28, margin: "auto" }}
              />
              <currentAction.icon className={`h-4 w-4 ${currentAction.color} relative z-10`} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {currentAction.verb}
              </span>
              {currentAction.detail && (
                <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                  {currentAction.detail}
                </span>
              )}
            </div>
            <motion.div
              className="flex gap-0.5 ml-auto"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 w-1 rounded-full ${currentAction.color}`}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {!currentAction && isWriting && (
          <motion.div
            key="writing"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full text-violet-500 opacity-20 bg-violet-500"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 28, height: 28, margin: "auto" }}
              />
              <Pencil className="h-4 w-4 text-violet-500 relative z-10" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Writing response
            </span>
            <motion.div
              className="flex gap-0.5 ml-auto"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1 w-1 rounded-full bg-violet-500" />
              ))}
            </motion.div>
          </motion.div>
        )}

        {!currentAction && !isWriting && (
          <motion.div
            key="thinking"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-violet-500 opacity-20"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 28, height: 28, margin: "auto" }}
              />
              <Brain className="h-4 w-4 text-violet-500 relative z-10" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Thinking...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
