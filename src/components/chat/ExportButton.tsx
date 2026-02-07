"use client";

import { Download } from "lucide-react";
import { StoredMessage } from "@/lib/store";
import toast from "react-hot-toast";

interface ExportButtonProps {
  title: string;
  messages: StoredMessage[];
}

export default function ExportButton({ title, messages }: ExportButtonProps) {
  const handleExport = () => {
    const md = messages
      .map((m) => {
        const role = m.role === "user" ? "**You**" : "**Assistant**";
        return `${role}\n\n${m.content}`;
      })
      .join("\n\n---\n\n");

    const content = `# ${title}\n\n${md}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  return (
    <button
      onClick={handleExport}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      title="Export as Markdown"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
