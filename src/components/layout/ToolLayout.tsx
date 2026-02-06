"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-[60px] flex flex-col">
        {/* Tool Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
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
