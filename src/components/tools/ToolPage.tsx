"use client";

import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { ArrowUp, Download, Copy, Check, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolLayout from "@/components/layout/ToolLayout";
import ThinkingIndicator from "@/components/chat/ThinkingIndicator";
import ErrorMessage from "@/components/chat/ErrorMessage";
import CodeBlock from "@/components/chat/CodeBlock";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ToolPageProps {
  toolId: string;
  title: string;
  icon: ReactNode;
  iconColor: string;
  placeholder: string;
  examples: string[];
}

export default function ToolPage({
  toolId,
  title,
  icon,
  iconColor,
  placeholder,
  examples,
}: ToolPageProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    contentRef.current?.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setIsLoading(true);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              parts: [{ type: "text", text: m.content }],
            })),
            tool: toolId,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        setIsStreaming(true);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "text-delta" && parsed.delta) {
                    accumulated += parsed.delta;
                    const current = accumulated;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: current }
                          : m
                      )
                    );
                  }
                } catch {
                  // skip non-JSON lines
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User stopped generation — not an error
          return;
        }
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        console.error("Stream error:", err);
        setError(errorMsg);
        toast.error(errorMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, messages, toolId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const handleCopy = async () => {
    if (lastAssistant) {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-output.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  const handleRetry = () => {
    setError(null);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      // Remove last assistant message (empty/error) and retry
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.role === "assistant" && !m.content)
        );
        return filtered;
      });
      handleSubmit(lastUser.content);
    }
  };

  const hasOutput = messages.some((m) => m.role === "assistant" && m.content);

  return (
    <ToolLayout title={title} icon={icon} iconColor={iconColor}>
      <div className="flex flex-col h-full">
        {!hasOutput && !isLoading ? (
          /* Empty state — prompt input */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div
              className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${iconColor}`}
            >
              <div className="scale-150">{icon}</div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8 text-center max-w-md">
              {placeholder}
            </p>

            {/* Error */}
            {error && (
              <div className="w-full max-w-2xl mb-4">
                <ErrorMessage error={error} onRetry={handleRetry} />
              </div>
            )}

            {/* Input */}
            <div className="w-full max-w-2xl">
              <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-gray-300 dark:focus-within:border-zinc-600">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full resize-none bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500 px-4 sm:px-5 pt-4 pb-2 text-base text-gray-900 dark:text-white"
                />
                <div className="flex items-center justify-end px-4 pb-3">
                  <button
                    onClick={() => handleSubmit(input)}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
                      input.trim() && !isLoading
                        ? "bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600"
                    )}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Example prompts */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(ex)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Output view */
          <>
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message, i) => {
                  const isLast = i === messages.length - 1;
                  const msgIsStreaming =
                    isLast && message.role === "assistant" && isStreaming;

                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[70%]">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  if (!message.content && isLoading) {
                    return (
                      <div key={message.id}>
                        <ThinkingIndicator />
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="animate-fade-in">
                      <div
                        className={cn(
                          "markdown-content text-sm bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm",
                          msgIsStreaming && "typing-cursor"
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
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {!msgIsStreaming && message.content && (
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copied ? "Copied" : "Copy"}
                          </button>
                          <button
                            onClick={() => handleDownload(message.content)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Error */}
                {error && (
                  <ErrorMessage error={error} onRetry={handleRetry} />
                )}
              </div>
            </div>

            {/* Stop button */}
            {isLoading && (
              <div className="flex justify-center py-2">
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Stop generating
                </button>
              </div>
            )}

            {/* Follow-up input */}
            <div className="border-t border-gray-100 dark:border-zinc-800 px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl flex items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask for changes or follow up..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500 px-4 py-3 text-sm text-gray-900 dark:text-white"
                  />
                  {isLoading ? (
                    <button
                      onClick={handleStop}
                      className="h-8 w-8 rounded-lg flex items-center justify-center m-1.5 transition-colors cursor-pointer bg-red-500 text-white hover:bg-red-600"
                      title="Stop generating"
                    >
                      <Square className="h-3 w-3 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubmit(input)}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center m-1.5 transition-colors cursor-pointer",
                        input.trim() && !isLoading
                          ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                          : "text-gray-300 dark:text-zinc-600"
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
