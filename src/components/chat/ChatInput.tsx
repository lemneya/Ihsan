"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, Paperclip, Globe, Sparkles, Square } from "lucide-react";
import toast from "react-hot-toast";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  size?: "default" | "large";
  autoFocus?: boolean;
}

export default function ChatInput({
  onSubmit,
  isLoading = false,
  onStop,
  placeholder = "Ask anything...",
  size = "default",
  autoFocus = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Cmd+Enter also submits
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "relative flex flex-col bg-input-bg border border-border rounded-2xl shadow-sm transition-shadow focus-within:shadow-md focus-within:border-accent/50",
          size === "large" && "rounded-3xl"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className={cn(
            "w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground",
            size === "large"
              ? "px-4 sm:px-6 pt-5 pb-2 text-base sm:text-lg"
              : "px-3 sm:px-4 pt-3 pb-2 text-sm"
          )}
        />
        <div
          className={cn(
            "flex items-center justify-between",
            size === "large" ? "px-3 sm:px-4 pb-4" : "px-2 sm:px-3 pb-2.5"
          )}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toast("File attachments coming soon", { icon: "📎" })}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast("Web search coming soon", { icon: "🌐" })}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              title="Search the web"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              title="Use Sparkpage"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className={cn(
                "flex items-center justify-center rounded-xl transition-all cursor-pointer bg-red-500 text-white hover:bg-red-600",
                size === "large" ? "h-10 w-10" : "h-8 w-8"
              )}
              title="Stop generating"
            >
              <Square className={cn(size === "large" ? "h-4 w-4" : "h-3 w-3", "fill-current")} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex items-center justify-center rounded-xl transition-all cursor-pointer",
                size === "large" ? "h-10 w-10" : "h-8 w-8",
                input.trim() && !isLoading
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ArrowUp className={size === "large" ? "h-5 w-5" : "h-4 w-4"} />
            </button>
          )}
        </div>
      </div>
      <p
        className={cn(
          "text-center text-muted-foreground mt-2",
          size === "large" ? "text-xs" : "text-[11px]"
        )}
      >
        Ihsan can make mistakes. Verify important information.
      </p>
    </form>
  );
}
