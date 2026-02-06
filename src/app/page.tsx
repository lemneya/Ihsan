"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import SearchBar from "@/components/chat/SearchBar";
import ToolGrid from "@/components/layout/ToolGrid";
import { defaultModel, ModelConfig } from "@/lib/models";

export default function Home() {
  const router = useRouter();
  const [selectedModel] = useState<ModelConfig>(defaultModel);

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
      {/* Left Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-[60px]">
        {/* Top bar */}
        <div className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer">
              Sign in
            </button>
            <button className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
              Sign up
            </button>
          </div>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center justify-center px-4 mt-16">
          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-10">
            Ihsan AI Workspace
          </h1>

          {/* Search Bar */}
          <SearchBar onSubmit={handleSubmit} />

          {/* Tool Grid */}
          <div className="mt-14">
            <ToolGrid />
          </div>
        </div>
      </main>
    </div>
  );
}
