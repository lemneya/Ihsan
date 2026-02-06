"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquarePlus,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  conversations: ConversationItem[];
  activeId?: string;
  onNewChat: () => void;
  onDelete?: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onDelete,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar-bg border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Ihsan</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-2">
        <Button
          variant="primary"
          className={cn("w-full", collapsed ? "px-0" : "")}
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <History className="h-3 w-3" />
            Recent
          </div>
        )}
        <div className="space-y-1 mt-1">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                activeId === conv.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {collapsed ? (
                <Search className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  )}
                </>
              )}
            </Link>
          ))}
          {conversations.length === 0 && !collapsed && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              No conversations yet. Start a new chat!
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", collapsed ? "px-0 justify-center" : "")}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </Button>
      </div>
    </aside>
  );
}
