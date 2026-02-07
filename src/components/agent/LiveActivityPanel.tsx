"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Search,
  Globe,
  Code,
  FileDown,
  GitBranch,
  Presentation,
  FileText,
  Palette,
  Sheet,
  Image,
  Music,
  Video,
  Loader2,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/chat/CodeBlock";
import type { AgentRunState, ToolCallState } from "@/lib/agent-types";

// ─── Tool metadata ──────────────────────────────────────────────────

const toolMeta: Record<string, { icon: React.ElementType; label: string; activity: string }> = {
  web_search: { icon: Search, label: "Web Search", activity: "Searching the web" },
  web_fetch: { icon: Globe, label: "Browser", activity: "Browsing" },
  run_javascript: { icon: Code, label: "Code Editor", activity: "Running code" },
  create_artifact: { icon: FileDown, label: "File Creator", activity: "Creating file" },
  create_diagram: { icon: GitBranch, label: "Diagram Editor", activity: "Creating diagram" },
  generate_slides: { icon: Presentation, label: "Slide Builder", activity: "Using Ihsan Slides" },
  generate_document: { icon: FileText, label: "Document Editor", activity: "Using Ihsan Docs" },
  generate_code: { icon: Code, label: "Developer", activity: "Using Ihsan Developer" },
  generate_design: { icon: Palette, label: "Designer", activity: "Using Ihsan Designer" },
  generate_spreadsheet: { icon: Sheet, label: "Spreadsheet", activity: "Using Ihsan Sheets" },
  generate_image_prompts: { icon: Image, label: "Image Studio", activity: "Using Ihsan Image" },
  generate_music: { icon: Music, label: "Music Studio", activity: "Using Ihsan Music" },
  generate_video_script: { icon: Video, label: "Video Script", activity: "Using Ihsan Video" },
};

// ─── Find active tool call ──────────────────────────────────────────

function findActiveTool(state: AgentRunState): ToolCallState | null {
  // Find the last executing tool
  for (let i = state.steps.length - 1; i >= 0; i--) {
    for (let j = state.steps[i].toolCalls.length - 1; j >= 0; j--) {
      const tc = state.steps[i].toolCalls[j];
      if (tc.status === "executing") return tc;
    }
  }
  // Fall back to last completed tool
  for (let i = state.steps.length - 1; i >= 0; i--) {
    for (let j = state.steps[i].toolCalls.length - 1; j >= 0; j--) {
      return state.steps[i].toolCalls[j];
    }
  }
  return null;
}

// ─── Web Search View ─────────────────────────────────────────────────

function WebSearchView({ tc }: { tc: ToolCallState }) {
  const query = String(tc.args.query || "");
  const data = tc.result as Record<string, unknown> | undefined;
  const results = data && Array.isArray(data.results) ? data.results as { title: string; snippet: string; url: string }[] : [];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-foreground">{query}</span>
      </div>

      {tc.status === "executing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="space-y-0.5">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
              >
                {r.title}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
              <p className="text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Web Fetch View ──────────────────────────────────────────────────

function WebFetchView({ tc }: { tc: ToolCallState }) {
  const url = String(tc.args.url || "");
  const data = tc.result as Record<string, unknown> | undefined;
  const content = data ? String(data.content || "") : "";
  const title = data && typeof data.title === "string" ? data.title : "";
  let hostname = "";
  try { hostname = new URL(url).hostname; } catch { hostname = url; }

  return (
    <div className="space-y-3">
      {/* URL bar */}
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <Globe className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <span className="text-xs text-muted-foreground truncate font-mono">{hostname}</span>
      </div>

      {tc.status === "executing" && (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading page...</span>
        </div>
      )}

      {tc.status === "done" && (
        <div className="space-y-2">
          {title && <h4 className="text-sm font-semibold text-foreground">{title}</h4>}
          <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
            {content.slice(0, 1500)}
            {content.length > 1500 && (
              <span className="text-muted-foreground/50">... ({Math.round(content.length / 1000)}K chars)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Code Execution View ─────────────────────────────────────────────

function CodeView({ tc }: { tc: ToolCallState }) {
  const code = typeof tc.args.code === "string" ? tc.args.code : "";
  const data = tc.result as Record<string, unknown> | undefined;

  return (
    <div className="space-y-3">
      {/* Code */}
      {code && <CodeBlock language="javascript">{code}</CodeBlock>}

      {tc.status === "executing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running...
        </div>
      )}

      {tc.status === "done" && data && (
        <div className="bg-zinc-900 text-green-400 rounded-lg p-3 text-xs font-mono">
          <div className="text-zinc-500 mb-1">// Output</div>
          {data.result !== undefined && <div>&gt; {String(data.result)}</div>}
          {Array.isArray(data.logs) && data.logs.length > 0 && (
            <div className="text-zinc-400 mt-1">{(data.logs as string[]).join("\n")}</div>
          )}
          {typeof data.error === "string" && data.error && (
            <div className="text-red-400">{data.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Diagram View ────────────────────────────────────────────────────

function DiagramView({ tc }: { tc: ToolCallState }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const data = tc.result as Record<string, unknown> | undefined;
  const diagramCode = data && typeof data.diagram === "string" ? data.diagram : "";

  useEffect(() => {
    if (!diagramCode) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
        const id = `panel-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, diagramCode);
        if (!cancelled) setSvg(rendered);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [diagramCode]);

  if (tc.status === "executing") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        Rendering diagram...
      </div>
    );
  }

  if (svg) {
    return (
      <div
        ref={containerRef}
        className="bg-white dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  if (diagramCode) {
    return <CodeBlock language="mermaid">{diagramCode}</CodeBlock>;
  }

  return null;
}

// ─── Ihsan Tool Content View ─────────────────────────────────────────

function IhsanToolView({ tc }: { tc: ToolCallState }) {
  const data = tc.result as Record<string, unknown> | undefined;
  const content = data && typeof data.content === "string" ? data.content : "";
  const preview = content.length > 2000 ? content.slice(0, 2000) + "\n\n..." : content;

  if (tc.status === "executing") {
    return (
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground py-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span>Generating content...</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-6 rounded-full bg-violet-300 dark:bg-violet-700"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="prose prose-xs dark:prose-invert max-w-none text-xs max-h-[500px] overflow-y-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeStr = String(children).replace(/\n$/, "");
            if (match) return <CodeBlock language={match[1]}>{codeStr}</CodeBlock>;
            return <code className="bg-muted px-1 py-0.5 rounded text-[0.75rem]" {...props}>{children}</code>;
          },
        }}
      >
        {preview}
      </ReactMarkdown>
    </div>
  );
}

// ─── Thinking View ───────────────────────────────────────────────────

function ThinkingView({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
          <Monitor className="h-6 w-6 text-violet-500" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-violet-500"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Processing</p>
        <p className="text-xs text-muted-foreground max-w-[250px]">
          {text || "Ihsan is analyzing and planning the next action..."}
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-violet-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Render tool activity ────────────────────────────────────────────

function renderToolActivity(tc: ToolCallState) {
  switch (tc.name) {
    case "web_search":
      return <WebSearchView tc={tc} />;
    case "web_fetch":
      return <WebFetchView tc={tc} />;
    case "run_javascript":
      return <CodeView tc={tc} />;
    case "create_diagram":
      return <DiagramView tc={tc} />;
    default:
      return <IhsanToolView tc={tc} />;
  }
}

// ─── Main Panel ──────────────────────────────────────────────────────

interface LiveActivityPanelProps {
  state: AgentRunState;
}

export default function LiveActivityPanel({ state }: LiveActivityPanelProps) {
  const activeTool = findActiveTool(state);
  const meta = activeTool ? toolMeta[activeTool.name] : null;
  const Icon = meta?.icon || Monitor;
  const isThinking = !activeTool || (
    state.status === "running" &&
    !state.steps.some(s => s.toolCalls.some(tc => tc.status === "executing")) &&
    !activeTool
  );

  // Get current step text for thinking view
  const currentText = state.steps.length > 0 ? state.steps[state.steps.length - 1].text : "";

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header — Ihsan's activity window */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-muted/30">
        {/* Window dots */}
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            Ihsan&apos;s Workspace
          </span>
          {activeTool && meta && (
            <span className="text-xs text-muted-foreground truncate">
              — {meta.activity}
            </span>
          )}
        </div>

        {/* Activity indicator */}
        {state.status === "running" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">live</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isThinking ? (
          <ThinkingView text={currentText.slice(0, 100)} />
        ) : activeTool ? (
          <motion.div
            key={activeTool.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderToolActivity(activeTool)}
          </motion.div>
        ) : (
          <ThinkingView text="" />
        )}
      </div>

      {/* Step counter at bottom */}
      {state.steps.length > 0 && (
        <div className="border-t border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${state.status === "running" ? "bg-violet-500 animate-pulse" : "bg-green-500"}`} />
            <span className="text-xs text-muted-foreground">
              {state.status === "running" ? "Thinking" : "Complete"}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {state.steps.filter(s => s.completedAt).length} / {state.steps.length}
          </span>
        </div>
      )}
    </div>
  );
}
