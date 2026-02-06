"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { ArrowUp, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolLayout from "@/components/layout/ToolLayout";
import { cn } from "@/lib/utils";

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
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/tools",
        body: { tool: toolId },
      }),
    [toolId]
  );

  const { messages, status, sendMessage } = useChat({ transport });
  const isLoading = status === "submitted" || status === "streaming";

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

  const handleSubmit = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lastAssistantText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOutput = messages.some((m) => m.role === "assistant");

  return (
    <ToolLayout title={title} icon={icon} iconColor={iconColor}>
      <div className="flex flex-col h-full">
        {!hasOutput ? (
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
                  className="w-full resize-none bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500 px-5 pt-4 pb-2 text-base text-gray-900 dark:text-white"
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
              className="flex-1 overflow-y-auto px-6 py-6"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message, i) => {
                  const text =
                    message.parts
                      ?.filter(
                        (p): p is { type: "text"; text: string } =>
                          p.type === "text"
                      )
                      .map((p) => p.text)
                      .join("") || "";

                  const isLast = i === messages.length - 1;
                  const isStreaming =
                    isLast &&
                    message.role === "assistant" &&
                    isLoading;

                  if (message.role === "user") {
                    return (
                      <div
                        key={message.id}
                        className="flex justify-end"
                      >
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[70%]">
                          {text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className="animate-fade-in"
                    >
                      <div
                        className={cn(
                          "markdown-content text-sm bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm",
                          isStreaming && "typing-cursor"
                        )}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {text}
                        </ReactMarkdown>
                      </div>
                      {!isStreaming && text && (
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
                            onClick={() => {
                              const blob = new Blob([text], {
                                type: "text/markdown",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${toolId}-output.md`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
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

                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500">
                      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-pulse" />
                      Generating...
                    </div>
                  )}
              </div>
            </div>

            {/* Follow-up input */}
            <div className="border-t border-gray-100 dark:border-zinc-800 px-6 py-4">
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
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
