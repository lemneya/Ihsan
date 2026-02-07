"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  FileText,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import SlidePreview from "@/components/agent/SlidePreview";

// ─── Types ──────────────────────────────────────────────────────────

interface SlideContent {
  title: string;
  subtitle: string;
  bullet: string;
}

interface SlideExecutionViewProps {
  prompt: string;
  logs: string[];
  slides: SlideContent[];
  status: "starting" | "generating" | "done" | "idle";
  onBack: () => void;
  onRegenerate?: () => void;
}

// ─── Convert streamed slides to markdown for SlidePreview ───────────

function slidesToMarkdown(slides: SlideContent[]): string {
  return slides
    .map((s, i) => {
      const lines: string[] = [];
      lines.push(`## Slide ${i + 1}: ${s.title}`);
      if (s.subtitle) lines.push(`- ${s.subtitle}`);
      if (s.bullet) lines.push(`- ${s.bullet}`);
      return lines.join("\n");
    })
    .join("\n---\n");
}

// ─── Component ──────────────────────────────────────────────────────

export default function SlideExecutionView({
  prompt,
  logs,
  slides,
  status,
  onBack,
  onRegenerate,
}: SlideExecutionViewProps) {
  // Convert streamed slide data to markdown for the real SlidePreview
  const markdown = useMemo(() => slidesToMarkdown(slides), [slides]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full bg-[#FAFAFA]"
    >
      {/* ─── LEFT: INTELLIGENCE PANEL ──────────────────────────── */}
      <div className="w-[400px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
        {/* Back button header */}
        <div className="h-14 border-b border-gray-200 flex items-center px-4 flex-shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            Slide Generation
          </span>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Task Header */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-1">
              <Sparkles size={14} /> Task
            </div>
            <div className="text-gray-900 font-medium leading-snug text-sm">
              &ldquo;{prompt}&rdquo;
            </div>
          </div>

          {/* Live Steps */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === "done"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {status === "done" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full animate-ping" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Generating Presentation
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Building outline and designing slides...
                </p>

                {/* Terminal Log */}
                <div className="mt-4 pl-3 border-l-2 border-gray-100 space-y-3">
                  <AnimatePresence>
                    {logs.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        {log}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {status !== "done" && (
                    <div className="text-xs text-gray-400 italic animate-pulse ml-3">
                      Thinking...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary (appears when done) */}
            <AnimatePresence>
              {status === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Summary
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    I&apos;ve created a {slides.length}-slide deck covering the
                    requested topic. The presentation includes an overview,
                    technical details, and future implications. You can export
                    this directly to PowerPoint or PDF.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 shadow-sm cursor-pointer transition-colors">
                      <FileText size={12} /> Copy Text
                    </button>
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 shadow-sm cursor-pointer transition-colors"
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: CANVAS — Real SlidePreview ────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {slides.length > 0 ? (
          <SlidePreview markdown={markdown} title="Untitled Presentation" />
        ) : (
          /* Skeleton while waiting for first slide */
          <div className="flex-1 flex items-center justify-center bg-zinc-800/50 p-8">
            <div className="w-full max-w-lg aspect-video bg-[#0f172a] rounded-lg shadow-2xl p-12 flex flex-col gap-4 animate-pulse">
              <div className="h-1 bg-violet-500 w-full rounded" />
              <div className="h-8 w-3/4 bg-slate-700/50 rounded-lg mt-4" />
              <div className="h-4 w-1/2 bg-slate-700/50 rounded-lg" />
              <div className="h-20 w-full bg-slate-800/50 rounded-lg mt-6" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
