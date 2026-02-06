"use client";

import { Sparkles, Menu } from "lucide-react";
import Button from "@/components/ui/Button";
import ModelSelector from "@/components/chat/ModelSelector";
import { ModelConfig } from "@/lib/models";
import Link from "next/link";

interface HeaderProps {
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export default function Header({
  selectedModel,
  onModelChange,
  onToggleSidebar,
  showSidebarToggle,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold">Ihsan</span>
        </Link>
      </div>
      <ModelSelector selected={selectedModel} onChange={onModelChange} />
    </header>
  );
}
