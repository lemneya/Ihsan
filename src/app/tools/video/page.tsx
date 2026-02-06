"use client";

import { Video } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function VideoPage() {
  return (
    <ToolPage
      toolId="video"
      title="AI Video"
      icon={<Video className="h-6 w-6" />}
      iconColor="bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400"
      placeholder="Describe your video concept — I'll create scripts, storyboards, and AI video prompts"
      examples={[
        "Product launch video for a new app",
        "YouTube explainer about blockchain",
        "30-second social media ad for sneakers",
        "Corporate training video on cybersecurity",
      ]}
    />
  );
}
