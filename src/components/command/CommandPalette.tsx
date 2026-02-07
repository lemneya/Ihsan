"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  Settings,
  Presentation,
  Sheet,
  FileText,
  Code,
  Palette,
  Image,
  Music,
  Video,
  FileAudio,
  LayoutGrid,
  Sparkles,
  Trash2,
  Globe,
  Bot,
} from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme, setSettingsOpen, conversations } = useAppStore();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  function runAction(fn: () => void) {
    fn();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 text-sm bg-transparent outline-none border-b border-border placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-6 text-sm text-center text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item
                onSelect={() => runAction(() => router.push("/chat/new"))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                New Chat
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => setSettingsOpen(true))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Open Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Theme" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item
                onSelect={() => runAction(() => setTheme("light"))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
              >
                <Sun className="h-4 w-4 text-muted-foreground" />
                Light Mode
                {theme === "light" && <span className="ml-auto text-xs text-accent">Active</span>}
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => setTheme("dark"))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
              >
                <Moon className="h-4 w-4 text-muted-foreground" />
                Dark Mode
                {theme === "dark" && <span className="ml-auto text-xs text-accent">Active</span>}
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => setTheme("system"))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
              >
                <Monitor className="h-4 w-4 text-muted-foreground" />
                System Theme
                {theme === "system" && <span className="ml-auto text-xs text-accent">Active</span>}
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Tools" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {[
                { label: "Custom Agent", href: "/tools/custom-agent", icon: LayoutGrid },
                { label: "AI Slides", href: "/tools/slides", icon: Presentation },
                { label: "AI Sheets", href: "/tools/sheets", icon: Sheet },
                { label: "AI Docs", href: "/tools/docs", icon: FileText },
                { label: "AI Developer", href: "/tools/developer", icon: Code },
                { label: "AI Designer", href: "/tools/designer", icon: Palette },
                { label: "AI Image", href: "/tools/image", icon: Image },
                { label: "AI Music", href: "/tools/music", icon: Music },
                { label: "AI Video", href: "/tools/video", icon: Video },
                { label: "AI Meeting Notes", href: "/tools/meeting-notes", icon: FileAudio },
                { label: "Browser Agent", href: "/tools/browser-agent", icon: Globe },
                { label: "AI Agent", href: "/tools/agent", icon: Bot },
                { label: "All Agents", href: "/tools/agents", icon: Sparkles },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <Command.Item
                    key={tool.href}
                    onSelect={() => runAction(() => router.push(tool.href))}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {tool.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            {conversations.length > 0 && (
              <Command.Group heading="Recent Conversations" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {conversations.slice(0, 5).map((conv) => (
                  <Command.Item
                    key={conv.id}
                    onSelect={() => runAction(() => router.push(`/chat/${conv.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer data-[selected=true]:bg-muted"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{conv.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Danger Zone" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item
                onSelect={() =>
                  runAction(() => {
                    if (confirm("Clear all conversations? This cannot be undone.")) {
                      useAppStore.getState().clearAllConversations();
                    }
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-red-500 data-[selected=true]:bg-red-50 dark:data-[selected=true]:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Conversations
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Navigate with ↑↓ · Select with ↵</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">ESC</kbd>
          </div>
        </Command>
      </div>
    </div>
  );
}
