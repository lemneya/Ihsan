"use client";

import { Presentation } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function SlidesPage() {
  return (
    <ToolPage
      toolId="slides"
      title="AI Slides"
      icon={<Presentation className="h-6 w-6" />}
      iconColor="bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"
      placeholder="Describe your presentation topic and I'll create a full slide deck"
      examples={[
        "AI trends in 2026",
        "Startup pitch deck for a fintech app",
        "Climate change overview for students",
        "Quarterly business review template",
      ]}
    />
  );
}
