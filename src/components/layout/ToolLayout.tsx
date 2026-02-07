"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useSidebarOffset } from "@/hooks/useSidebarOffset";

interface ToolLayoutProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  children: ReactNode;
}

export default function ToolLayout({
  title,
  icon,
  iconColor,
  children,
}: ToolLayoutProps) {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sidebarOffset = useSidebarOffset();

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className={`flex-1 transition-[margin] duration-300 flex flex-col ${sidebarOffset}`}>
        {/* Tool Header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColor}`}
          >
            {icon}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
