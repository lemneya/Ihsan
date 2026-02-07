"use client";

import { useCallback } from "react";
import { Send, Zap } from "lucide-react";
import { motion } from "framer-motion";
import QuickActionPills from "./QuickActionPills";

interface HeroSectionProps {
  onSubmit: (task: string, mode?: "normal" | "deep") => void;
  deepMode: boolean;
  onDeepModeToggle: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function HeroSection({
  onSubmit,
  deepMode,
  onDeepModeToggle,
  inputRef,
}: HeroSectionProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const task = inputRef.current?.value || "";
        if (task.trim()) {
          onSubmit(task.trim(), deepMode ? "deep" : "normal");
          if (inputRef.current) inputRef.current.value = "";
        }
      }
    },
    [onSubmit, inputRef, deepMode]
  );

  const handleSubmitClick = useCallback(() => {
    const task = inputRef.current?.value || "";
    if (task.trim()) {
      onSubmit(task.trim(), deepMode ? "deep" : "normal");
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onSubmit, inputRef, deepMode]);

  const handlePillSelect = useCallback(
    (prompt: string) => {
      if (inputRef.current) {
        inputRef.current.value = prompt;
        inputRef.current.focus();
        // Place cursor at end
        inputRef.current.setSelectionRange(prompt.length, prompt.length);
      }
    },
    [inputRef]
  );

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero text */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-foreground"
          >
            What can I do for you?
          </motion.h1>
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-muted-foreground text-sm"
          >
            Assign a task or ask anything
          </motion.p>
        </div>

        {/* Textarea input */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
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
              {/* Deep mode toggle */}
              <button
                onClick={onDeepModeToggle}
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
                onClick={handleSubmitClick}
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

        {/* Quick action pills */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <QuickActionPills onSelect={handlePillSelect} />
        </motion.div>
      </div>
    </div>
  );
}
