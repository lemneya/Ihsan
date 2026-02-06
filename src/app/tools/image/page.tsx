"use client";

import { Image } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function ImagePage() {
  return (
    <ToolPage
      toolId="image"
      title="AI Image"
      icon={<Image className="h-6 w-6" />}
      iconColor="bg-teal-50 text-teal-500 dark:bg-teal-950 dark:text-teal-400"
      placeholder="Describe the image you want and I'll create optimized prompts for AI image generators"
      examples={[
        "A futuristic cityscape at sunset",
        "Logo for an AI startup called Nova",
        "Cozy cabin in a snowy forest",
        "Abstract art representing innovation",
      ]}
    />
  );
}
