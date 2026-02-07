"use client";

import { useState, useRef, useCallback } from "react";
import {
  Globe,
  ArrowUp,
  FileText,
  Search,
  Languages,
  Brain,
  ListChecks,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolLayout from "@/components/layout/ToolLayout";
import CodeBlock from "@/components/chat/CodeBlock";
import ThinkingIndicator from "@/components/chat/ThinkingIndicator";
import ErrorMessage from "@/components/chat/ErrorMessage";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface AnalysisResult {
  id: string;
  action: string;
  content: string;
  pageTitle?: string;
  pageUrl?: string;
}

const actions = [
  { id: "summarize", label: "Summarize", icon: FileText, color: "text-blue-500" },
  { id: "extract", label: "Extract Data", icon: Search, color: "text-green-500" },
  { id: "explain", label: "Explain", icon: Brain, color: "text-purple-500" },
  { id: "translate", label: "Translate", icon: Languages, color: "text-orange-500" },
  { id: "analyze", label: "Analyze", icon: Sparkles, color: "text-pink-500" },
  { id: "action-items", label: "Action Items", icon: ListChecks, color: "text-cyan-500" },
];

export default function BrowserAgentPage() {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (targetUrl: string) => {
    setIsFetching(true);
    setError(null);
    try {
      // Use a simple proxy approach - fetch via our API
      const res = await fetch("/api/browser-agent/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (!res.ok) throw new Error("Failed to fetch page");
      const data = await res.json();
      setPageContent(data.content);
      setPageTitle(data.title || targetUrl);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch page";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleAnalyze = useCallback(
    async (action: string, userMessage?: string) => {
      if (!pageContent && !url.trim()) {
        toast.error("Enter a URL first");
        return;
      }

      setError(null);
      setIsLoading(true);

      let content = pageContent;
      let title = pageTitle;

      // Fetch page if not already fetched
      if (!content && url.trim()) {
        const data = await fetchPage(url.trim());
        if (!data) {
          setIsLoading(false);
          return;
        }
        content = data.content;
        title = data.title || url;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/browser-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageContent: content,
            pageUrl: url,
            pageTitle: title,
            action,
            userMessage: userMessage || question,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        const resultId = crypto.randomUUID();

        setResult({
          id: resultId,
          action,
          content: "",
          pageTitle: title,
          pageUrl: url,
        });

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            const current = accumulated;
            setResult((prev) =>
              prev ? { ...prev, content: current } : null
            );
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [pageContent, pageTitle, url, question, fetchPage]
  );

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleCopy = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;
    const data = await fetchPage(url.trim());
    if (data) {
      toast.success("Page loaded — choose an action");
    }
  };

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    handleAnalyze("question", question);
    setQuestion("");
  };

  return (
    <ToolLayout
      title="Browser Agent"
      icon={<Globe className="h-5 w-5" />}
      iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-400"
    >
      <div className="flex flex-col h-full">
        {/* URL Input Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-border bg-card/50">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPageContent(null);
                  setPageTitle("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlSubmit();
                }}
                placeholder="Enter a URL to analyze (e.g., https://example.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={!url.trim() || isFetching}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer shrink-0",
                url.trim() && !isFetching
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load"
              )}
            </button>
          </div>

          {/* Page loaded indicator */}
          {pageContent && (
            <div className="max-w-4xl mx-auto mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="truncate">
                  Loaded: <span className="font-medium text-foreground">{pageTitle}</span>
                </span>
                <span className="text-[10px] opacity-60">
                  ({Math.round(pageContent.length / 1000)}k chars)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {!result && !isLoading ? (
              /* Empty state — action buttons */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Browser Agent</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                  {pageContent
                    ? "Page loaded. Choose an action or ask a question about the content."
                    : "Enter a URL above to load a page, then analyze it with AI."}
                </p>

                {error && (
                  <div className="w-full max-w-2xl mb-6">
                    <ErrorMessage error={error} onRetry={handleUrlSubmit} />
                  </div>
                )}

                {/* Action grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleAnalyze(action.id)}
                        disabled={!pageContent || isLoading}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card transition-all cursor-pointer",
                          pageContent
                            ? "hover:bg-muted hover:border-accent/30 hover:shadow-sm"
                            : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon className={`h-5 w-5 ${action.color}`} />
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question input */}
                {pageContent && (
                  <div className="w-full max-w-lg">
                    <div className="relative bg-card border border-border rounded-xl flex items-end">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuestionSubmit();
                        }}
                        placeholder="Ask a question about this page..."
                        className="flex-1 bg-transparent outline-none px-4 py-3 text-sm placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={handleQuestionSubmit}
                        disabled={!question.trim()}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center m-1.5 transition-colors cursor-pointer",
                          question.trim()
                            ? "bg-accent text-white"
                            : "text-muted-foreground"
                        )}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Example URLs */}
                {!pageContent && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "https://en.wikipedia.org/wiki/Artificial_intelligence",
                      "https://news.ycombinator.com",
                      "https://github.com/trending",
                    ].map((exUrl) => (
                      <button
                        key={exUrl}
                        onClick={() => {
                          setUrl(exUrl);
                          setPageContent(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        {new URL(exUrl).hostname}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Result view */
              <div>
                {/* Result header */}
                {result && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{result.pageTitle}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {actions.find((a) => a.id === result.action)?.label || "Analysis"}
                      </span>
                    </div>
                    {result.content && !isLoading && (
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                )}

                {/* Thinking */}
                {isLoading && !result?.content && <ThinkingIndicator />}

                {/* Result content */}
                {result?.content && (
                  <div
                    className={cn(
                      "markdown-content text-sm bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm",
                      isLoading && "typing-cursor"
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
                      {result.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4">
                    <ErrorMessage error={error} onRetry={() => handleAnalyze(result?.action || "summarize")} />
                  </div>
                )}

                {/* Stop button */}
                {isLoading && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Square className="h-3 w-3 fill-current" />
                      Stop
                    </button>
                  </div>
                )}

                {/* Actions bar after result */}
                {!isLoading && result?.content && (
                  <div className="mt-6 space-y-4">
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      {actions
                        .filter((a) => a.id !== result.action)
                        .map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleAnalyze(action.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Icon className={`h-3 w-3 ${action.color}`} />
                              {action.label}
                            </button>
                          );
                        })}
                    </div>

                    {/* Follow-up question */}
                    <div className="relative bg-card border border-border rounded-xl flex items-end">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuestionSubmit();
                        }}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 bg-transparent outline-none px-4 py-3 text-sm placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={handleQuestionSubmit}
                        disabled={!question.trim()}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center m-1.5 transition-colors cursor-pointer",
                          question.trim()
                            ? "bg-accent text-white"
                            : "text-muted-foreground"
                        )}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
