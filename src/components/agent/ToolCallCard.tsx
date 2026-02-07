"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Globe,
  Code,
  FileDown,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  Download,
  Presentation,
  FileText,
  Palette,
  Sheet,
  Image,
  Music,
  Video,
  GitBranch,
  FileType,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/chat/CodeBlock";
import type { ToolCallState } from "@/lib/agent-types";

const toolMeta: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  web_search: { icon: Search, label: "Web Search", color: "text-blue-500" },
  web_fetch: { icon: Globe, label: "Fetch Page", color: "text-emerald-500" },
  run_javascript: { icon: Code, label: "Run Code", color: "text-purple-500" },
  create_artifact: { icon: FileDown, label: "Create File", color: "text-orange-500" },
  create_diagram: { icon: GitBranch, label: "Diagram", color: "text-cyan-500" },
  generate_slides: { icon: Presentation, label: "Ihsan Slides", color: "text-red-500" },
  generate_document: { icon: FileText, label: "Ihsan Docs", color: "text-blue-500" },
  generate_code: { icon: Code, label: "Ihsan Developer", color: "text-purple-500" },
  generate_design: { icon: Palette, label: "Ihsan Designer", color: "text-pink-500" },
  generate_spreadsheet: { icon: Sheet, label: "Ihsan Sheets", color: "text-green-500" },
  generate_image_prompts: { icon: Image, label: "Ihsan Image", color: "text-teal-500" },
  generate_music: { icon: Music, label: "Ihsan Music", color: "text-orange-500" },
  generate_video_script: { icon: Video, label: "Ihsan Video", color: "text-rose-500" },
};

// Ihsan tools that return { content } as markdown
const IHSAN_CONTENT_TOOLS = new Set([
  "generate_slides",
  "generate_document",
  "generate_code",
  "generate_design",
  "generate_spreadsheet",
  "generate_image_prompts",
  "generate_music",
  "generate_video_script",
]);

function argsSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "web_search":
      return String(args.query || "");
    case "web_fetch":
      return String(args.url || "");
    case "run_javascript":
      return "JavaScript code";
    case "create_artifact":
      return String(args.title || "file");
    case "create_diagram":
      return String(args.title || "diagram");
    case "generate_slides":
      return String(args.topic || "").slice(0, 60);
    case "generate_document":
      return String(args.brief || "").slice(0, 60);
    case "generate_code":
      return String(args.spec || "").slice(0, 60);
    case "generate_design":
      return String(args.brief || "").slice(0, 60);
    case "generate_spreadsheet":
      return String(args.request || "").slice(0, 60);
    case "generate_image_prompts":
      return String(args.description || "").slice(0, 60);
    case "generate_music":
      return String(args.request || "").slice(0, 60);
    case "generate_video_script":
      return String(args.concept || "").slice(0, 60);
    default:
      return JSON.stringify(args).slice(0, 60);
  }
}

/** Mermaid diagram renderer */
function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
        });
        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, code);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="text-xs">
        <p className="text-red-500 mb-2">Diagram render error: {error}</p>
        <CodeBlock language="mermaid">{code}</CodeBlock>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Rendering diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function renderResult(name: string, result: unknown) {
  if (!result) return null;
  const data = result as Record<string, unknown>;

  if (name === "web_search" && Array.isArray(data.results)) {
    return (
      <div className="space-y-2">
        {(data.results as { title: string; snippet: string; url: string }[]).map(
          (r, i) => (
            <div key={i} className="text-xs">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium"
              >
                {r.title}
              </a>
              <p className="text-muted-foreground mt-0.5 line-clamp-2">
                {r.snippet}
              </p>
            </div>
          )
        )}
        {typeof data.message === "string" && (
          <p className="text-xs text-muted-foreground">{data.message}</p>
        )}
      </div>
    );
  }

  if (name === "web_fetch") {
    const content = String(data.content || "");
    const title = typeof data.title === "string" ? data.title : "";
    const preview = content.slice(0, 500);
    return (
      <div className="text-xs">
        {title && <p className="font-medium mb-1">{title}</p>}
        <p className="text-muted-foreground whitespace-pre-wrap">
          {preview}
          {content.length > 500 && "..."}
        </p>
        <p className="text-muted-foreground mt-1">
          {String(data.length || content.length)} chars
        </p>
      </div>
    );
  }

  if (name === "run_javascript") {
    const hasResult = data.result !== undefined;
    const hasError = typeof data.error === "string" && data.error.length > 0;
    return (
      <div className="text-xs space-y-1">
        {hasResult && (
          <p>
            <span className="text-muted-foreground">Result: </span>
            {String(data.result)}
          </p>
        )}
        {Array.isArray(data.logs) && data.logs.length > 0 && (
          <pre className="text-muted-foreground whitespace-pre-wrap bg-muted rounded p-2 mt-1">
            {(data.logs as string[]).join("\n")}
          </pre>
        )}
        {hasError && <p className="text-red-500">{String(data.error)}</p>}
      </div>
    );
  }

  if (name === "create_artifact") {
    return (
      <div>
        <CodeBlock language={String(data.language || "")}>
          {String(data.content || "")}
        </CodeBlock>
      </div>
    );
  }

  // Mermaid diagram
  if (name === "create_diagram" && typeof data.diagram === "string") {
    return <MermaidDiagram code={data.diagram} />;
  }

  // Ihsan platform tools — render content as markdown
  if (IHSAN_CONTENT_TOOLS.has(name) && typeof data.content === "string") {
    const content = data.content;
    const preview = content.length > 2000 ? content.slice(0, 2000) + "\n\n..." : content;
    return (
      <div className="prose prose-xs dark:prose-invert max-w-none text-xs">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeStr = String(children).replace(/\n$/, "");
              if (match) {
                return <CodeBlock language={match[1]}>{codeStr}</CodeBlock>;
              }
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-[0.75rem]" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {preview}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback: render as JSON
  return (
    <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted rounded p-2">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function handleDownload(data: Record<string, unknown>) {
  const content = String(data.content || "");
  const title = String(data.title || "artifact.txt");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = title;
  a.click();
  URL.revokeObjectURL(url);
}

function isDownloadable(name: string): boolean {
  return name === "create_artifact" || IHSAN_CONTENT_TOOLS.has(name);
}

async function handlePptxDownload(data: Record<string, unknown>) {
  const content = String(data.content || "");
  const { parseSlideMarkdown } = await import("@/lib/slides-parser");
  const { generatePptx, downloadBlob } = await import("@/lib/slides-to-pptx");
  const slides = parseSlideMarkdown(content);
  const blob = await generatePptx(slides, "Presentation");
  downloadBlob(blob, "presentation.pptx");
}

export default function ToolCallCard({ tc }: { tc: ToolCallState }) {
  const [expanded, setExpanded] = useState(false);
  const meta = toolMeta[tc.name] || {
    icon: Code,
    label: tc.name,
    color: "text-gray-500",
  };
  const Icon = meta.icon;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex-shrink-0">
          {tc.status === "executing" && (
            <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
          )}
          {tc.status === "done" && (
            <Check className="h-3.5 w-3.5 text-green-500" />
          )}
          {tc.status === "error" && (
            <X className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>

        <Icon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />
        <span className="text-sm font-medium flex-shrink-0">{meta.label}</span>
        <span className="text-xs text-muted-foreground truncate flex-1">
          {argsSummary(tc.name, tc.args)}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {tc.name === "generate_slides" && tc.status === "done" && typeof tc.result === "object" && tc.result !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePptxDownload(tc.result as Record<string, unknown>);
              }}
              className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
              title="Download PPTX"
            >
              <FileType className="h-3.5 w-3.5 text-red-500" />
            </button>
          )}
          {isDownloadable(tc.name) && tc.status === "done" && typeof tc.result === "object" && tc.result !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(tc.result as Record<string, unknown>);
              }}
              className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
              title="Download Markdown"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          {(() => {
            if (tc.name === "run_javascript" && typeof tc.args.code === "string") {
              return (
                <CodeBlock language="javascript">{tc.args.code}</CodeBlock>
              );
            }
            if (tc.name === "create_diagram" && typeof tc.args.diagram === "string") {
              return (
                <CodeBlock language="mermaid">{tc.args.diagram}</CodeBlock>
              );
            }
            return (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Input: </span>
                {Object.entries(tc.args).map(([k, v]) => (
                  <span key={k}>
                    {k}=
                    {typeof v === "string"
                      ? `"${v.length > 80 ? v.slice(0, 80) + "..." : v}"`
                      : JSON.stringify(v)}{" "}
                  </span>
                ))}
              </div>
            );
          })()}

          {tc.status === "done" && tc.result !== undefined && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Output:</p>
              {renderResult(tc.name, tc.result)}
            </div>
          )}

          {tc.status === "error" && tc.error && (
            <p className="text-xs text-red-500">{tc.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
