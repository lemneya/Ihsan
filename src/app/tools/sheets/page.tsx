"use client";

import { Sheet } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function SheetsPage() {
  return (
    <ToolPage
      toolId="sheets"
      title="AI Sheets"
      icon={<Sheet className="h-6 w-6" />}
      iconColor="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
      placeholder="Describe what data you need and I'll generate structured tables and analysis"
      examples={[
        "Compare top 10 programming languages",
        "Monthly budget tracker template",
        "Competitor analysis for SaaS tools",
        "Employee performance review data",
      ]}
    />
  );
}
