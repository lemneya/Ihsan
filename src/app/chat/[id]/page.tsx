"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useMemo, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Share, RotateCcw, Square, Menu } from "lucide-react";
import Link from "next/link";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import SparkPage from "@/components/search/SparkPage";
import ThinkingIndicator from "@/components/chat/ThinkingIndicator";
import ErrorMessage from "@/components/chat/ErrorMessage";
import ScrollToBottom from "@/components/chat/ScrollToBottom";
import SuggestedPrompts from "@/components/chat/SuggestedPrompts";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ExportButton from "@/components/chat/ExportButton";
import ModelSelector from "@/components/chat/ModelSelector";
import Button from "@/components/ui/Button";
import { models, defaultModel, ModelConfig } from "@/lib/models";
import { useAppStore, StoredMessage } from "@/lib/store";
import toast from "react-hot-toast";

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
  const modelParam =
    searchParams.get("model") || "claude-sonnet-4-5-20250929";

  const [selectedModel, setSelectedModel] = useState<ModelConfig>(
    models.find((m) => m.modelId === modelParam) || defaultModel
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  const { addConversation, getConversation, setSidebarOpen } = useAppStore();

  // Load saved conversation if exists and no query param
  const savedConv = getConversation(id);
  const savedMessages = useMemo(() => {
    if (!initialQuery && savedConv && savedConv.messages.length > 0) {
      return savedConv.messages.map((m) => ({
        id: m.id,
        role: m.role as "system" | "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      }));
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const { messages, status, sendMessage, regenerate, stop, error, clearError, setMessages } = useChat({
    transport,
    messages: savedMessages,
    onError: (err) => {
      console.error("[Ihsan Chat Error]", err);
    },
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

  // Persist conversation
  useEffect(() => {
    if (messages.length === 0) return;

    const storedMessages: StoredMessage[] = messages
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content:
          m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") || "",
      }))
      .filter((m) => m.content.trim().length > 0);

    const firstUserMsg = storedMessages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "")
      : "New conversation";

    addConversation({
      id,
      title,
      createdAt: Date.now(),
      model: selectedModel,
      messages: storedMessages,
    });
  }, [messages, id, selectedModel, addConversation]);

  const handleSubmit = (message: string) => {
    if (error) clearError();
    sendMessage({ text: message });
  };

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      // Find the message index
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      // Truncate messages to the edited message (remove everything after it)
      const truncated = messages.slice(0, msgIndex);

      // Update messages and send the edited content
      setMessages(truncated);

      // Small delay to let state settle, then send
      setTimeout(() => {
        sendMessage({ text: newContent });
      }, 50);
    },
    [messages, setMessages, sendMessage]
  );

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  // Build stored messages for export
  const storedMessages: StoredMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content:
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("") || "",
  }));

  const firstUserMsg = storedMessages.find((m) => m.role === "user");
  const conversationTitle = firstUserMsg
    ? firstUserMsg.content.substring(0, 60)
    : "Conversation";

  return (
    <div className="flex flex-col h-screen relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold hidden sm:inline">Ihsan</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ModelSelector
            selected={selectedModel}
            onChange={setSelectedModel}
          />
          {storedMessages.length > 0 && (
            <ExportButton title={conversationTitle} messages={storedMessages} />
          )}
          <Button variant="ghost" size="icon" title="Share" onClick={handleShare}>
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto" ref={chatAreaRef}>
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen onSelect={handleSubmit} />
        ) : (
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
                      onEdit={
                        message.role === "user" && !isLoading
                          ? (newContent) => handleEditMessage(message.id, newContent)
                          : undefined
                      }
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking indicator */}
          {status === "submitted" && messages[messages.length - 1]?.role === "user" && (
            <ThinkingIndicator />
          )}

          {/* Error display */}
          {error && (
            <ErrorMessage
              error={error.message || "Something went wrong. Please try again."}
              onRetry={() => {
                clearError();
                regenerate();
              }}
            />
          )}

          {/* Retry button */}
          {!isLoading && !error && messages.length > 1 && (
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

          {/* Suggested follow-ups */}
          {!isLoading && !error && messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && (() => {
            const lastMsg = messages[messages.length - 1];
            const lastText = lastMsg.parts?.filter((p) => p.type === "text").map((p) => p.text).join("") || "";
            return lastText ? (
              <SuggestedPrompts
                lastAssistantContent={lastText}
                onSelect={handleSubmit}
              />
            ) : null;
          })()}

          <div ref={messagesEndRef} />
        </div>
        )}
      </div>

      {/* Scroll to bottom */}
      <ScrollToBottom containerRef={chatAreaRef} />

      {/* Stop button */}
      {isLoading && (
        <div className="flex justify-center -mt-2 mb-2">
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop generating
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={handleStop}
            placeholder="Ask a follow-up question..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
