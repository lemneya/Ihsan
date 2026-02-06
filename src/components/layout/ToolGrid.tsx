"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Presentation,
  Sheet,
  FileText,
  Code,
  Palette,
  MessageSquare,
  Image,
  Music,
  Video,
  FileAudio,
  Sparkles,
} from "lucide-react";

interface Tool {
  icon: React.ReactNode;
  label: string;
  color: string;
  badge?: string;
  href: string;
}

const tools: Tool[] = [
  {
    icon: <LayoutGrid className="h-6 w-6" />,
    label: "Custom Agent",
    color: "bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
    href: "/tools/custom-agent",
  },
  {
    icon: <Presentation className="h-6 w-6" />,
    label: "AI Slides",
    color: "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400",
    href: "/tools/slides",
  },
  {
    icon: <Sheet className="h-6 w-6" />,
    label: "AI Sheets",
    color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    href: "/tools/sheets",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    label: "AI Docs",
    color: "bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400",
    href: "/tools/docs",
  },
  {
    icon: <Code className="h-6 w-6" />,
    label: "AI Developer",
    color: "bg-purple-50 text-purple-500 dark:bg-purple-950 dark:text-purple-400",
    href: "/tools/developer",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    label: "AI Designer",
    color: "bg-pink-50 text-pink-500 dark:bg-pink-950 dark:text-pink-400",
    href: "/tools/designer",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    label: "AI Chat",
    color: "bg-indigo-50 text-indigo-500 dark:bg-indigo-950 dark:text-indigo-400",
    badge: "Unlimited",
    href: "/chat/new",
  },
  {
    icon: <Image className="h-6 w-6" />,
    label: "AI Image",
    color: "bg-teal-50 text-teal-500 dark:bg-teal-950 dark:text-teal-400",
    badge: "Unlimited",
    href: "/tools/image",
  },
  {
    icon: <Music className="h-6 w-6" />,
    label: "AI Music",
    color: "bg-orange-50 text-orange-500 dark:bg-orange-950 dark:text-orange-400",
    href: "/tools/music",
  },
  {
    icon: <Video className="h-6 w-6" />,
    label: "AI Video",
    color: "bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400",
    href: "/tools/video",
  },
  {
    icon: <FileAudio className="h-6 w-6" />,
    label: "AI Meeting Notes",
    color: "bg-cyan-50 text-cyan-500 dark:bg-cyan-950 dark:text-cyan-400",
    href: "/tools/meeting-notes",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    label: "All Agents",
    color: "bg-amber-50 text-amber-500 dark:bg-amber-950 dark:text-amber-400",
    href: "/tools/agents",
  },
];

export default function ToolGrid() {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
      {tools.map((tool) => (
        <Link
          key={tool.label}
          href={tool.href}
          className="flex flex-col items-center gap-2 w-20 group"
        >
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tool.color}`}
          >
            {tool.icon}
          </div>
          <span className="text-xs text-gray-600 dark:text-zinc-400 text-center leading-tight">
            {tool.label}
          </span>
          {tool.badge && (
            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full -mt-1">
              {tool.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
