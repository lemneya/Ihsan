"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  model?: string;
  onEdit?: (newContent: string) => void;
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
  model,
  onEdit,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback((prev) => (prev === type ? null : type));
    toast.success("Thanks for your feedback!");
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText.trim() !== content && onEdit) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(content);
    setIsEditing(false);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-6 animate-fade-in group">
        <div className="flex items-start gap-3 max-w-[80%]">
          {/* Edit button — appears on hover */}
          {onEdit && !isEditing && (
            <button
              onClick={() => {
                setEditText(content);
                setIsEditing(true);
              }}
              className="self-center p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Edit message"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full min-w-[280px]">
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSubmit();
                  }
                  if (e.key === "Escape") handleEditCancel();
                }}
                className="w-full resize-none bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                rows={1}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editText.trim() || editText.trim() === content}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer",
                    editText.trim() && editText.trim() !== content
                      ? "bg-accent text-white hover:bg-accent-dark"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  Save & Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-accent text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
              {content}
            </div>
          )}
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children }) {
                  return <>{children}</>;
                },
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (match || codeString.includes("\n")) {
                    return (
                      <CodeBlock language={match?.[1]}>
                        {codeString}
                      </CodeBlock>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
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
                onClick={() => handleFeedback("up")}
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  feedback === "up"
                    ? "text-green-500 bg-green-50 dark:bg-green-950"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Good response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  feedback === "down"
                    ? "text-red-500 bg-red-50 dark:bg-red-950"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
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
