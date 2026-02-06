"use client";

import { Sparkles } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function AgentsPage() {
  return (
    <ToolPage
      toolId="agents"
      title="All Agents"
      icon={<Sparkles className="h-6 w-6" />}
      iconColor="bg-amber-50 text-amber-500 dark:bg-amber-950 dark:text-amber-400"
      placeholder="Browse available agents or describe your task — I'll recommend the best agent"
      examples={[
        "Show me all available agents",
        "Which agent is best for writing a blog post?",
        "I need help analyzing sales data",
        "Find me an agent for learning Python",
      ]}
    />
  );
}
