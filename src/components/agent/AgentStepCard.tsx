"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/chat/CodeBlock";
import ToolCallCard from "./ToolCallCard";
import type { AgentStep } from "@/lib/agent-types";

interface AgentStepCardProps {
  step: AgentStep;
  isLast: boolean;
}

export default function AgentStepCard({ step, isLast }: AgentStepCardProps) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold z-10">
          {step.index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Step content */}
      <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-6"}`}>
        {/* AI text */}
        {step.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-3 text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");
                  if (match) {
                    return (
                      <CodeBlock language={match[1]}>{codeStr}</CodeBlock>
                    );
                  }
                  return (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-[0.8125rem]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {step.text}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool calls */}
        {step.toolCalls.length > 0 && (
          <div className="space-y-2">
            {step.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} tc={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
