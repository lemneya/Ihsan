"use client";

import { Code } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function DeveloperPage() {
  return (
    <ToolPage
      toolId="developer"
      title="AI Developer"
      icon={<Code className="h-6 w-6" />}
      iconColor="bg-purple-50 text-purple-500 dark:bg-purple-950 dark:text-purple-400"
      placeholder="Describe what you want to build and I'll generate complete, working code"
      examples={[
        "Build a todo app with React",
        "Create a REST API with Node.js and Express",
        "Python script to scrape and analyze data",
        "Landing page with HTML, CSS, and animations",
      ]}
    />
  );
}
