"use client";

import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";

interface SuggestedPromptsProps {
  lastAssistantContent: string;
  onSelect: (prompt: string) => void;
}

function generateSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lower = content.toLowerCase();

  // Detect topic and suggest follow-ups
  if (lower.includes("code") || lower.includes("function") || lower.includes("```")) {
    suggestions.push("Can you add error handling?");
    suggestions.push("How would I write tests for this?");
    suggestions.push("Can you optimize this code?");
  } else if (lower.includes("api") || lower.includes("endpoint") || lower.includes("request")) {
    suggestions.push("What about authentication?");
    suggestions.push("How do I handle errors?");
    suggestions.push("Can you show a usage example?");
  } else if (lower.includes("design") || lower.includes("css") || lower.includes("style")) {
    suggestions.push("Can you make it responsive?");
    suggestions.push("Add dark mode support");
    suggestions.push("What about accessibility?");
  } else if (lower.includes("database") || lower.includes("sql") || lower.includes("query")) {
    suggestions.push("How do I optimize this query?");
    suggestions.push("What about indexing?");
    suggestions.push("Can you add pagination?");
  } else {
    suggestions.push("Tell me more about this");
    suggestions.push("Can you give an example?");
    suggestions.push("What are the alternatives?");
  }

  return suggestions.slice(0, 3);
}

export default function SuggestedPrompts({
  lastAssistantContent,
  onSelect,
}: SuggestedPromptsProps) {
  const suggestions = useMemo(
    () => generateSuggestions(lastAssistantContent),
    [lastAssistantContent]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:border-accent/30 transition-all cursor-pointer"
        >
          <ArrowUpRight className="h-3 w-3" />
          {suggestion}
        </button>
      ))}
    </div>
  );
}
