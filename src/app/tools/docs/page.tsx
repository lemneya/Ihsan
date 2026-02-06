"use client";

import { FileText } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function DocsPage() {
  return (
    <ToolPage
      toolId="docs"
      title="AI Docs"
      icon={<FileText className="h-6 w-6" />}
      iconColor="bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400"
      placeholder="Describe the document you need — reports, proposals, essays, guides, and more"
      examples={[
        "Write a project proposal for a mobile app",
        "Create a technical design document",
        "Draft a company policy on remote work",
        "Write a research summary on AI in healthcare",
      ]}
    />
  );
}
