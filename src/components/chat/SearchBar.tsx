"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Paperclip,
  Mic,
  CornerDownLeft,
  User,
  Link as LinkIcon,
} from "lucide-react";

interface SearchBarProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSubmit, isLoading = false }: SearchBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:shadow-md focus-within:border-gray-300 dark:focus-within:border-zinc-600">
        {/* Input area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, create anything"
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500 px-5 pt-4 pb-2 text-base text-gray-900 dark:text-white"
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 pb-3">
          {/* Left icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Mention"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Add link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Model indicators */}
            <div className="flex items-center gap-1 mr-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">G</span>
              </div>
              <div className="h-5 w-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">C</span>
              </div>
            </div>

            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer",
                input.trim() && !isLoading
                  ? "text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  : "text-gray-300 dark:text-zinc-600"
              )}
              title="Submit"
            >
              <CornerDownLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Integration banner */}
      <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500 dark:text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-sm">✉</span>
          <span className="text-blue-500 text-sm">📊</span>
          <span className="text-green-500 text-sm">📝</span>
          <span className="text-yellow-500 text-sm">📁</span>
        </div>
        <span>Ihsan supports personalized tools</span>
        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer">
          ✕
        </button>
      </div>
    </form>
  );
}
