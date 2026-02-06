"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ExternalLink,
  BookOpen,
  Globe,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Source {
  title: string;
  url: string;
  snippet: string;
}

interface SparkPageProps {
  title: string;
  summary: string;
  sections?: {
    heading: string;
    content: string;
  }[];
  sources?: Source[];
  isLoading?: boolean;
}

export default function SparkPage({
  title,
  summary,
  sections = [],
  sources = [],
  isLoading = false,
}: SparkPageProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-sparkpage-bg p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-accent animate-pulse" />
          <span className="text-sm font-medium text-accent">
            Generating Sparkpage...
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded-lg sparkpage-loading" />
          <div className="h-4 w-full rounded sparkpage-loading" />
          <div className="h-4 w-5/6 rounded sparkpage-loading" />
          <div className="h-4 w-4/6 rounded sparkpage-loading" />
          <div className="mt-4 h-4 w-full rounded sparkpage-loading" />
          <div className="h-4 w-3/4 rounded sparkpage-loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-sparkpage-bg overflow-hidden mb-6 animate-fade-in">
      {/* Header */}
      <div className="bg-accent/5 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent uppercase tracking-wider">
            Sparkpage
          </span>
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {/* Summary */}
      <div className="px-6 py-4">
        <div className="markdown-content text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
      </div>

      {/* Sections */}
      {sections.length > 0 && (
        <div className="px-6 pb-4 space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="border-t border-border pt-4">
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                {section.heading}
              </h3>
              <div className="markdown-content text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="border-t border-border px-6 py-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Sources
          </h4>
          <div className="grid gap-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl bg-card border border-border p-3 hover:bg-muted transition-colors group"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {source.title}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {source.snippet}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
