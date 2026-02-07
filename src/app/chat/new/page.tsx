"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import { defaultModel, ModelConfig } from "@/lib/models";
import ModelSelector from "@/components/chat/ModelSelector";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatInput from "@/components/chat/ChatInput";

export default function NewChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(defaultModel);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sidebarOffset = useSidebarOffset();

  const handleSubmit = (message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      q: message,
      provider: selectedModel.provider,
      model: selectedModel.modelId,
    });
    router.push(`/chat/${id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className={`flex-1 transition-[margin] duration-300 flex flex-col ${sidebarOffset}`}>
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <span className="font-semibold hidden sm:inline">Ihsan</span>
            </Link>
          </div>
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        </header>

        <div className="flex-1 overflow-y-auto">
          <WelcomeScreen onSelect={handleSubmit} />
        </div>

        <div className="border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <ChatInput
              onSubmit={handleSubmit}
              placeholder="Ask anything..."
              autoFocus
            />
          </div>
        </div>
      </main>
    </div>
  );
}
