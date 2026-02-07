"use client";

import { useState } from "react";
import {
  Presentation,
  Globe,
  FileText,
  Palette,
  Code,
  ChevronDown,
  Sheet,
  Music,
  Video,
  Image,
  Search,
  BarChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prompt: string;
  color: string;
}

const primaryActions: QuickAction[] = [
  {
    icon: Presentation,
    label: "Create slides",
    prompt: "Create a presentation about ",
    color: "text-red-500 bg-red-50 dark:bg-red-950/50",
  },
  {
    icon: Globe,
    label: "Build website",
    prompt: "Build me a website for ",
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    icon: FileText,
    label: "Write document",
    prompt: "Write a professional document about ",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: Palette,
    label: "Design",
    prompt: "Design a UI for ",
    color: "text-pink-500 bg-pink-50 dark:bg-pink-950/50",
  },
  {
    icon: Code,
    label: "Generate code",
    prompt: "Write code to ",
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950/50",
  },
];

const moreActions: QuickAction[] = [
  {
    icon: Sheet,
    label: "Spreadsheet",
    prompt: "Create a spreadsheet with ",
    color: "text-green-500 bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: Music,
    label: "Music",
    prompt: "Create music for ",
    color: "text-orange-500 bg-orange-50 dark:bg-orange-950/50",
  },
  {
    icon: Video,
    label: "Video script",
    prompt: "Write a video script about ",
    color: "text-rose-500 bg-rose-50 dark:bg-rose-950/50",
  },
  {
    icon: Image,
    label: "Image prompts",
    prompt: "Generate image prompts for ",
    color: "text-teal-500 bg-teal-50 dark:bg-teal-950/50",
  },
  {
    icon: Search,
    label: "Research",
    prompt: "Research and write a report about ",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50",
  },
  {
    icon: BarChart,
    label: "Diagram",
    prompt: "Create a diagram showing ",
    color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50",
  },
];

interface QuickActionPillsProps {
  onSelect: (prompt: string) => void;
}

export default function QuickActionPills({ onSelect }: QuickActionPillsProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {primaryActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => onSelect(action.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all cursor-pointer"
            >
              <Icon className={`h-3.5 w-3.5 ${action.color.split(" ")[0]}`} />
              {action.label}
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + primaryActions.length * 0.05 }}
          onClick={() => setShowMore((s) => !s)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all cursor-pointer"
        >
          More
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 justify-center overflow-hidden"
          >
            {moreActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelect(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all cursor-pointer"
                >
                  <Icon className={`h-3.5 w-3.5 ${action.color.split(" ")[0]}`} />
                  {action.label}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
