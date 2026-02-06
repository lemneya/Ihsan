"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import SearchBar from "@/components/chat/SearchBar";
import { defaultModel, ModelConfig } from "@/lib/models";
import ModelSelector from "@/components/chat/ModelSelector";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(defaultModel);

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
      <main className="flex-1 ml-[60px] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Chat
            </h1>
          </div>
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Start a conversation
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-8">
            Ask anything — powered by {selectedModel.name}
          </p>
          <div className="w-full max-w-2xl">
            <SearchBar onSubmit={handleSubmit} />
          </div>
        </div>
      </main>
    </div>
  );
}
