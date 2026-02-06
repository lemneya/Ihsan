"use client";

import { LayoutGrid } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function CustomAgentPage() {
  return (
    <ToolPage
      toolId="custom-agent"
      title="Custom Agent"
      icon={<LayoutGrid className="h-6 w-6" />}
      iconColor="bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
      placeholder="Describe the AI agent you want to build — I'll create the full configuration"
      examples={[
        "Customer support agent for an e-commerce store",
        "Personal fitness coach agent",
        "Code review agent for Python projects",
        "Social media content planning agent",
      ]}
    />
  );
}
