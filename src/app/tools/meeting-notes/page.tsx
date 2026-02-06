"use client";

import { FileAudio } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function MeetingNotesPage() {
  return (
    <ToolPage
      toolId="meeting-notes"
      title="AI Meeting Notes"
      icon={<FileAudio className="h-6 w-6" />}
      iconColor="bg-cyan-50 text-cyan-500 dark:bg-cyan-950 dark:text-cyan-400"
      placeholder="Paste meeting notes, a transcript, or describe a meeting — I'll organize and summarize"
      examples={[
        "Create an agenda for a sprint planning meeting",
        "Summarize action items from my notes",
        "Template for a board meeting",
        "Create follow-up email from meeting notes",
      ]}
    />
  );
}
