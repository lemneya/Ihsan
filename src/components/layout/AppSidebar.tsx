"use client";

import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Library,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Command,
  Users,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore, AgentTask } from "@/lib/store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import toast from "react-hot-toast";

// ─── Color palette for task icons ────────────────────────────────────
const TASK_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function getTaskColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return TASK_COLORS[Math.abs(hash) % TASK_COLORS.length];
}

// ─── Task Status Icon ───────────────────────────────────────────────

function TaskStatusIcon({
  status,
  className,
}: {
  status: AgentTask["status"];
  className?: string;
}) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className={cn(className, "text-green-500")} />;
    case "error":
      return <XCircle className={cn(className, "text-red-500")} />;
    case "running":
      return (
        <Loader2 className={cn(className, "text-violet-500 animate-spin")} />
      );
  }
}

// ─── Primary nav items ──────────────────────────────────────────────

const primaryNavItems = [
  { icon: Plus, label: "New task", href: "/" },
  { icon: Search, label: "Search", href: "#search" },
  { icon: Library, label: "Library", href: "#library" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    deleteConversation,
    setSettingsOpen,
    desktopSidebarExpanded,
    toggleDesktopSidebar,
    agentTasks,
    deleteAgentTask,
  } = useAppStore();

  // Merge tasks + conversations into a single sorted "all tasks" list
  const allItems = useMemo(() => {
    const taskItems = agentTasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      label: t.title,
      createdAt: t.createdAt,
      status: t.status,
      mode: t.mode,
      stepsCount: t.stepsCount,
    }));
    const chatItems = conversations.map((c) => ({
      type: "chat" as const,
      id: c.id,
      label: c.title,
      createdAt: c.createdAt,
      status: "completed" as const,
      mode: "normal" as const,
      stepsCount: 0,
    }));
    return [...taskItems, ...chatItems].sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }, [agentTasks, conversations]);

  function handlePrimaryNav(href: string) {
    if (href.startsWith("#")) {
      toast("Coming soon", { icon: "🚀" });
      return;
    }
    if (!isDesktop) setSidebarOpen(false);
    router.push(href);
  }

  function handleDeleteItem(type: "task" | "chat", id: string) {
    if (type === "task") {
      deleteAgentTask(id);
      toast.success("Task deleted");
      if (pathname === `/task/${id}`) router.push("/");
    } else {
      deleteConversation(id);
      toast.success("Conversation deleted");
      if (pathname === `/chat/${id}`) router.push("/");
    }
  }

  function getItemHref(type: "task" | "chat", id: string) {
    return type === "task" ? `/task/${id}` : `/chat/${id}`;
  }

  function isItemActive(type: "task" | "chat", id: string) {
    const href = getItemHref(type, id);
    return pathname === href;
  }

  // ─── Sidebar content (shared between desktop and mobile) ──────────
  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-col h-full bg-[#F9F9FB] dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={onNavigate}
          >
            <div className="h-7 w-7 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-black text-xs font-bold">
                I
              </span>
            </div>
            <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              ihsan
            </span>
          </Link>
          <button
            onClick={() => {
              if (isDesktop) {
                toggleDesktopSidebar();
              } else {
                setSidebarOpen(false);
              }
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Toggle sidebar"
          >
            {isDesktop ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Primary nav */}
        <div className="px-3 space-y-0.5">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" && pathname === "/" && item.label === "New task";
            return (
              <button
                key={item.label}
                onClick={() => {
                  handlePrimaryNav(item.href);
                  onNavigate?.();
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-xl px-3 py-2 text-[13px] transition-all cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white font-semibold"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Projects section */}
        <div className="mt-6 px-3">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Projects
            </span>
            <button
              className="p-0.5 rounded text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              onClick={() => toast("Coming soon", { icon: "🚀" })}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => toast("Coming soon", { icon: "🚀" })}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-[13px] text-gray-600 dark:text-zinc-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
          >
            <Folder className="h-4 w-4" strokeWidth={1.8} />
            <span>New project</span>
          </button>
        </div>

        {/* All tasks section */}
        <div className="mt-6 px-3 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              All tasks
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin">
            {allItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-zinc-600">
                <MessageSquare className="h-6 w-6 mb-2 opacity-40" />
                <p className="text-xs">No tasks yet</p>
              </div>
            )}
            {allItems.map((item) => {
              const active = isItemActive(item.type, item.id);
              const href = getItemHref(item.type, item.id);
              const colorClass = getTaskColor(item.id);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
                    active
                      ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  {/* Colored dot icon or status icon */}
                  {item.type === "task" && item.status === "running" ? (
                    <TaskStatusIcon
                      status="running"
                      className="h-4 w-4 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={cn(
                        "h-4 w-4 rounded flex-shrink-0 flex items-center justify-center",
                        colorClass
                      )}
                    >
                      {item.type === "task" && item.status === "completed" && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                      {item.type === "task" && item.status === "error" && (
                        <XCircle className="h-3 w-3 text-white" />
                      )}
                      {item.type === "chat" && (
                        <MessageSquare className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                  )}
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="truncate flex-1 min-w-0"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                  {/* Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.type === "task" &&
                      item.mode === "deep" &&
                      !active && (
                        <Zap className="h-3 w-3 text-amber-500 group-hover:hidden" />
                      )}
                    {item.type === "task" &&
                      item.status === "running" &&
                      !active && (
                        <span className="h-2 w-2 rounded-full bg-red-500 group-hover:hidden" />
                      )}
                  </div>
                  {/* Delete on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.type, item.id);
                      }}
                      className="p-0.5 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite teammates card */}
        <div className="px-3 pb-3 pt-2">
          <button
            onClick={() => toast("Coming soon", { icon: "🚀" })}
            className="w-full bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 rounded-xl px-4 py-3 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors" />
              <div>
                <p className="text-[13px] font-medium text-gray-700 dark:text-zinc-300">
                  Invite teammates
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Collaborate on tasks
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 h-12 border-t border-gray-200/60 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => {
              setSettingsOpen(true);
              onNavigate?.();
            }}
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={() => toast("Coming soon", { icon: "🚀" })}
          >
            <Command className="h-4 w-4" />
          </button>
          <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer">
            <span className="text-white text-[11px] font-semibold">U</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Desktop: collapsible panel ───────────────────────────────────
  if (isDesktop) {
    return (
      <>
        {/* Toggle button when collapsed */}
        {!desktopSidebarExpanded && (
          <button
            onClick={toggleDesktopSidebar}
            className="fixed left-4 top-4 z-50 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}

        {/* Sidebar panel */}
        <AnimatePresence>
          {desktopSidebarExpanded && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 h-full w-[280px] border-r border-gray-200/60 dark:border-zinc-800 z-40"
            >
              <SidebarContent />
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── Mobile: drawer overlay ───────────────────────────────────────
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 h-full w-[280px] border-r border-gray-200/60 dark:border-zinc-800 z-[70]"
          >
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
