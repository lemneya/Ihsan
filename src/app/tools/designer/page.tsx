"use client";

import { Palette } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function DesignerPage() {
  return (
    <ToolPage
      toolId="designer"
      title="AI Designer"
      icon={<Palette className="h-6 w-6" />}
      iconColor="bg-pink-50 text-pink-500 dark:bg-pink-950 dark:text-pink-400"
      placeholder="Describe your design need — logos, UI mockups, brand identity, and more"
      examples={[
        "Design a modern SaaS dashboard",
        "Create a brand identity for a coffee shop",
        "Design a mobile app onboarding flow",
        "Generate a color palette for a tech startup",
      ]}
    />
  );
}
