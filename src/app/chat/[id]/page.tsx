"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useMemo, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Share, RotateCcw } from "lucide-react";
import Link from "next/link";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import SparkPage from "@/components/search/SparkPage";
import ModelSelector from "@/components/chat/ModelSelector";
import Button from "@/components/ui/Button";
import { models, defaultModel, ModelConfig } from "@/lib/models";

function parseSparkPage(content: string) {
  const hasStructure = content.includes("## ") && content.length > 300;
  if (!hasStructure) return null;

  const lines = content.split("\n");
  let title = "";
  let summary = "";
  const sections: { heading: string; content: string }[] = [];
  let currentSection: { heading: string; content: string } | null = null;
  let inSummary = true;

  for (const line of lines) {
    if (line.startsWith("# ") && !title) {
      title = line.replace("# ", "");
      inSummary = true;
      continue;
    }
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { heading: line.replace("## ", ""), content: "" };
      inSummary = false;
      continue;
    }
    if (inSummary && !currentSection) {
      summary += line + "\n";
    } else if (currentSection) {
      currentSection.content += line + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);

  if (!title && sections.length > 0) {
    title = sections[0].heading;
  }

  return title ? { title, summary: summary.trim(), sections } : null;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const providerParam = searchParams.get("provider") || "anthropic";
  const modelParam =
    searchParams.get("model") || "claude-sonnet-4-5-20250929";

  const [selectedModel, setSelectedModel] = useState<ModelConfig>(
    models.find((m) => m.modelId === modelParam) || defaultModel
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          provider: selectedModel.provider,
          modelId: selectedModel.modelId,
        },
      }),
    [selectedModel]
  );

  const { messages, status, sendMessage, regenerate } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Send initial query
  useEffect(() => {
    if (initialQuery && !initialSent.current) {
      initialSent.current = true;
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, sendMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (message: string) => {
    sendMessage({ text: message });
  };

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const sparkPage =
    lastAssistantMessage && !isLoading
      ? parseSparkPage(
          lastAssistantMessage.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") || ""
        )
      : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold">Ihsan</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            selected={selectedModel}
            onChange={setSelectedModel}
          />
          <Button variant="ghost" size="icon" title="Share">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <AnimatePresence>
            {messages.map((message, i) => {
              const isLast = i === messages.length - 1;
              const isAssistantStreaming =
                isLast && message.role === "assistant" && isLoading;

              const messageText =
                message.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("") || "";

              // Check if this assistant message should show as Sparkpage
              const msgSparkPage =
                message.role === "assistant" && !isAssistantStreaming
                  ? parseSparkPage(messageText)
                  : null;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msgSparkPage ? (
                    <SparkPage
                      title={msgSparkPage.title}
                      summary={msgSparkPage.summary}
                      sections={msgSparkPage.sections}
                    />
                  ) : (
                    <ChatMessage
                      role={message.role as "user" | "assistant"}
                      content={messageText}
                      isStreaming={isAssistantStreaming}
                      model={
                        message.role === "assistant"
                          ? selectedModel.name
                          : undefined
                      }
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading state */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <SparkPage title="" summary="" isLoading={true} />
          )}

          {/* Retry button */}
          {!isLoading && messages.length > 1 && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerate()}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Ask a follow-up question..."
          />
        </div>
      </div>
    </div>
  );
}
