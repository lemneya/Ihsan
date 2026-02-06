"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  model?: string;
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
  model,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-6 animate-fade-in">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="bg-accent text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {content}
          </div>
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-6 animate-fade-in">
      <div className="flex items-start gap-3 max-w-[85%]">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          {model && (
            <p className="text-xs text-muted-foreground mb-1.5">{model}</p>
          )}
          <div
            className={cn(
              "markdown-content text-sm leading-relaxed",
              isStreaming && "typing-cursor"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          {!isStreaming && content && (
            <div className="flex items-center gap-1 mt-3">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Good response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Bad response"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
