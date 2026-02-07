"use client";

import { cn } from "@/lib/utils";
import {
  SquarePlus,
  Home,
  Mail,
  Network,
  HardDrive,
  User,
  Settings,
  Search,
  Trash2,
  X,
  Pencil,
  Check,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore, Conversation, AgentTask } from "@/lib/store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getTimeGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

interface GroupedConversations {
  label: string;
  items: Conversation[];
}

interface GroupedTasks {
  label: string;
  items: AgentTask[];
}

type SidebarTab = "tasks" | "chats";

const navItems = [
  { icon: SquarePlus, label: "New", href: "/" },
  { icon: Home, label: "Home", href: "/" },
  { icon: Mail, label: "AI Inbox", href: "#" },
  { icon: Network, label: "Hub", href: "#" },
  { icon: HardDrive, label: "AI Drive", href: "#" },
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
    renameConversation,
    togglePinConversation,
    setSettingsOpen,
    desktopSidebarExpanded,
    toggleDesktopSidebar,
    agentTasks,
    deleteAgentTask,
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("tasks");

  const { pinnedConvs, groupedConvs } = useMemo(() => {
    const filtered = searchQuery
      ? conversations.filter((c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : conversations;

    const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    const pinned = sorted.filter((c) => c.pinned);
    const unpinned = sorted.filter((c) => !c.pinned);

    const groupOrder = ["Today", "Yesterday", "This Week", "Older"];
    const groups: GroupedConversations[] = [];
    const groupMap = new Map<string, Conversation[]>();

    for (const conv of unpinned) {
      const group = getTimeGroup(conv.createdAt);
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(conv);
    }

    for (const label of groupOrder) {
      const items = groupMap.get(label);
      if (items && items.length > 0) {
        groups.push({ label, items });
      }
    }

    return { pinnedConvs: pinned, groupedConvs: groups };
  }, [conversations, searchQuery]);

  const groupedTasks = useMemo(() => {
    const filtered = searchQuery
      ? agentTasks.filter((t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : agentTasks;

    const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    const groupOrder = ["Today", "Yesterday", "This Week", "Older"];
    const groups: GroupedTasks[] = [];
    const groupMap = new Map<string, AgentTask[]>();

    for (const task of sorted) {
      const group = getTimeGroup(task.createdAt);
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(task);
    }

    for (const label of groupOrder) {
      const items = groupMap.get(label);
      if (items && items.length > 0) {
        groups.push({ label, items });
      }
    }

    return groups;
  }, [agentTasks, searchQuery]);

  function handleNavClick(href: string) {
    if (href === "#") {
      toast("Coming soon", { icon: "🚀" });
      return;
    }
    if (!isDesktop) setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    deleteConversation(id);
    toast.success("Conversation deleted");
    if (pathname === `/chat/${id}`) {
      router.push("/");
    }
  }

  function handleDeleteTask(id: string) {
    deleteAgentTask(id);
    toast.success("Task deleted");
    if (pathname === `/task/${id}`) {
      router.push("/");
    }
  }

  function startRename(id: string, currentTitle: string) {
    setEditingId(id);
    setEditTitle(currentTitle);
  }

  function commitRename(id: string) {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  }

  // ─── Tab switcher component ───
  function TabSwitcher({ className }: { className?: string }) {
    return (
      <div className={cn("flex rounded-lg bg-muted p-0.5", className)}>
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
            activeTab === "tasks"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="h-3.5 w-3.5" />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
            activeTab === "chats"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chats
        </button>
      </div>
    );
  }

  // Desktop: icon rail + expandable panel
  if (isDesktop) {
    return (
      <>
        {/* Icon rail — always visible */}
        <aside className="fixed left-0 top-0 h-full w-[60px] bg-white dark:bg-[#18181b] border-r border-gray-100 dark:border-zinc-800 flex flex-col items-center py-4 z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href && item.label !== "New";
            return item.href === "#" ? (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2.5 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1 cursor-pointer"
                )}
              >
                <div className="p-1.5 rounded-lg transition-colors">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2.5 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1",
                  isActive && "text-gray-900 dark:text-white",
                  item.label === "New" && "mb-2"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive && "bg-gray-100 dark:bg-zinc-800",
                    item.label === "New" &&
                      "bg-gray-100 dark:bg-zinc-800 rounded-lg"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Bottom buttons */}
          <div className="mt-auto flex flex-col items-center gap-1">
            <button
              onClick={toggleDesktopSidebar}
              className="flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1 cursor-pointer"
              title={desktopSidebarExpanded ? "Collapse panel" : "Expand panel"}
            >
              <div className="p-1.5">
                {desktopSidebarExpanded ? (
                  <PanelLeftClose className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" strokeWidth={1.5} />
                )}
              </div>
              <span>Panel</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1 cursor-pointer"
            >
              <div className="p-1.5">
                <Settings className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span>Settings</span>
            </button>
            <button className="flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1 cursor-pointer">
              <div className="p-1.5">
                <User className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </button>
          </div>
        </aside>

        {/* Expandable panel */}
        <AnimatePresence>
          {desktopSidebarExpanded && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-[60px] top-0 h-full w-[260px] bg-card border-r border-border flex flex-col z-40"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <TabSwitcher className="flex-1" />
                <Link
                  href="/"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
                  title="New task"
                >
                  <SquarePlus className="h-4 w-4" />
                </Link>
              </div>

              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-2 py-1">
                {activeTab === "tasks" ? (
                  <>
                    {groupedTasks.map((group) => (
                      <div key={group.label} className="mb-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                          {group.label}
                        </p>
                        <div className="space-y-px">
                          {group.items.map((task) => (
                            <DesktopTaskItem
                              key={task.id}
                              task={task}
                              pathname={pathname}
                              handleDeleteTask={handleDeleteTask}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {groupedTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Bot className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs">
                          {searchQuery ? "No matches" : "No tasks yet"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {pinnedConvs.length > 0 && (
                      <div className="mb-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </p>
                        <div className="space-y-px">
                          {pinnedConvs.map((conv) => (
                            <DesktopConversationItem
                              key={conv.id}
                              conv={conv}
                              pathname={pathname}
                              editingId={editingId}
                              editTitle={editTitle}
                              setEditTitle={setEditTitle}
                              commitRename={commitRename}
                              setEditingId={setEditingId}
                              startRename={startRename}
                              handleDelete={handleDelete}
                              togglePinConversation={togglePinConversation}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedConvs.map((group) => (
                      <div key={group.label} className="mb-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                          {group.label}
                        </p>
                        <div className="space-y-px">
                          {group.items.map((conv) => (
                            <DesktopConversationItem
                              key={conv.id}
                              conv={conv}
                              pathname={pathname}
                              editingId={editingId}
                              editTitle={editTitle}
                              setEditTitle={setEditTitle}
                              commitRename={commitRename}
                              setEditingId={setEditingId}
                              startRename={startRename}
                              handleDelete={handleDelete}
                              togglePinConversation={togglePinConversation}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    {pinnedConvs.length === 0 && groupedConvs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs">
                          {searchQuery ? "No matches" : "No conversations yet"}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Mobile: drawer overlay
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col z-[70]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white text-sm font-bold">I</span>
                </div>
                <span className="font-semibold text-lg">Ihsan</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <div className="px-3 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href && item.label !== "New";
                if (item.href === "#") {
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted cursor-pointer",
                        "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Tab switcher */}
            <div className="px-3 pb-2">
              <TabSwitcher />
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === "tasks" ? "Search tasks..." : "Search conversations..."}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-border">
              {activeTab === "tasks" ? (
                <>
                  {groupedTasks.map((group) => (
                    <div key={group.label} className="mb-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((task) => (
                          <MobileTaskItem
                            key={task.id}
                            task={task}
                            pathname={pathname}
                            handleDeleteTask={handleDeleteTask}
                            setSidebarOpen={setSidebarOpen}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {groupedTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                      {searchQuery ? "No matches found" : "No tasks yet"}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Pinned section */}
                  {pinnedConvs.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                        <Pin className="h-3 w-3" /> Pinned
                      </p>
                      <div className="space-y-0.5">
                        {pinnedConvs.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conv={conv}
                            pathname={pathname}
                            editingId={editingId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            commitRename={commitRename}
                            setEditingId={setEditingId}
                            startRename={startRename}
                            handleDelete={handleDelete}
                            togglePinConversation={togglePinConversation}
                            setSidebarOpen={setSidebarOpen}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time-grouped sections */}
                  {groupedConvs.map((group) => (
                    <div key={group.label} className="mb-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        {searchQuery ? `Results (${pinnedConvs.length + groupedConvs.reduce((s, g) => s + g.items.length, 0)})` : group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conv={conv}
                            pathname={pathname}
                            editingId={editingId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            commitRename={commitRename}
                            setEditingId={setEditingId}
                            startRename={startRename}
                            handleDelete={handleDelete}
                            togglePinConversation={togglePinConversation}
                            setSidebarOpen={setSidebarOpen}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {pinnedConvs.length === 0 && groupedConvs.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                      {searchQuery ? "No matches found" : "No conversations yet"}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3">
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Settings className="h-5 w-5" strokeWidth={1.5} />
                <span>Settings</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Desktop Task Item ──────────────────────────────────────────────

function DesktopTaskItem({
  task,
  pathname,
  handleDeleteTask,
}: {
  task: AgentTask;
  pathname: string;
  handleDeleteTask: (id: string) => void;
}) {
  const isActive = pathname === `/task/${task.id}`;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
      )}
    >
      <TaskStatusIcon status={task.status} className="h-3.5 w-3.5 flex-shrink-0" />
      <Link
        href={`/task/${task.id}`}
        className="truncate flex-1 min-w-0"
        title={task.title}
      >
        {task.title}
      </Link>
      <span className="text-[9px] text-muted-foreground shrink-0 group-hover:hidden flex items-center gap-1">
        {task.stepsCount > 0 && `${task.stepsCount}s`}
        {task.mode === "deep" && <Zap className="h-2.5 w-2.5 text-amber-500" />}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="p-0.5 cursor-pointer"
        >
          <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Mobile Task Item ───────────────────────────────────────────────

function MobileTaskItem({
  task,
  pathname,
  handleDeleteTask,
  setSidebarOpen,
}: {
  task: AgentTask;
  pathname: string;
  handleDeleteTask: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
        pathname === `/task/${task.id}`
          ? "bg-muted text-foreground"
          : "text-muted-foreground"
      )}
    >
      <TaskStatusIcon status={task.status} className="h-3.5 w-3.5 flex-shrink-0" />
      <Link
        href={`/task/${task.id}`}
        onClick={() => setSidebarOpen(false)}
        className="truncate flex-1"
        title={task.title}
      >
        {task.title}
      </Link>
      <span className="text-[10px] text-muted-foreground shrink-0 group-hover:hidden flex items-center gap-1.5">
        {task.stepsCount > 0 && (
          <span className="text-[9px] opacity-60">{task.stepsCount}s</span>
        )}
        <span className="hidden sm:inline">{getRelativeTime(task.createdAt)}</span>
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="p-0.5 cursor-pointer"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
  );
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
      return <Loader2 className={cn(className, "text-violet-500 animate-spin")} />;
  }
}

// ─── Desktop Conversation Item ──────────────────────────────────────

function DesktopConversationItem({
  conv,
  pathname,
  editingId,
  editTitle,
  setEditTitle,
  commitRename,
  setEditingId,
  startRename,
  handleDelete,
  togglePinConversation,
}: {
  conv: Conversation;
  pathname: string;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  commitRename: (id: string) => void;
  setEditingId: (id: string | null) => void;
  startRename: (id: string, title: string) => void;
  handleDelete: (id: string) => void;
  togglePinConversation: (id: string) => void;
}) {
  const isActive = pathname === `/chat/${conv.id}`;
  const msgCount = conv.messages?.length ?? 0;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
      )}
    >
      {editingId === conv.id ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => commitRename(conv.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename(conv.id);
            if (e.key === "Escape") setEditingId(null);
          }}
          className="flex-1 bg-transparent outline-none text-xs border-b border-accent min-w-0"
          autoFocus
        />
      ) : (
        <Link
          href={`/chat/${conv.id}`}
          className="truncate flex-1 min-w-0"
          title={conv.title}
        >
          {conv.title}
        </Link>
      )}
      <span className="text-[9px] text-muted-foreground shrink-0 group-hover:hidden">
        {msgCount > 0 && `${msgCount}`}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => {
            togglePinConversation(conv.id);
            toast.success(conv.pinned ? "Unpinned" : "Pinned");
          }}
          className="p-0.5 cursor-pointer"
          title={conv.pinned ? "Unpin" : "Pin"}
        >
          {conv.pinned ? (
            <PinOff className="h-2.5 w-2.5 text-accent" />
          ) : (
            <Pin className="h-2.5 w-2.5 text-muted-foreground hover:text-accent" />
          )}
        </button>
        <button
          onClick={() => startRename(conv.id, conv.title)}
          className="p-0.5 cursor-pointer"
        >
          <Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button
          onClick={() => handleDelete(conv.id)}
          className="p-0.5 cursor-pointer"
        >
          <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Mobile Conversation Item ───────────────────────────────────────

function ConversationItem({
  conv,
  pathname,
  editingId,
  editTitle,
  setEditTitle,
  commitRename,
  setEditingId,
  startRename,
  handleDelete,
  togglePinConversation,
  setSidebarOpen,
}: {
  conv: Conversation;
  pathname: string;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  commitRename: (id: string) => void;
  setEditingId: (id: string | null) => void;
  startRename: (id: string, title: string) => void;
  handleDelete: (id: string) => void;
  togglePinConversation: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
        pathname === `/chat/${conv.id}`
          ? "bg-muted text-foreground"
          : "text-muted-foreground"
      )}
    >
      {conv.pinned ? (
        <Pin className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : (
        <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
      )}
      {editingId === conv.id ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => commitRename(conv.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename(conv.id);
            if (e.key === "Escape") setEditingId(null);
          }}
          className="flex-1 bg-transparent outline-none text-sm border-b border-accent"
          autoFocus
        />
      ) : (
        <Link
          href={`/chat/${conv.id}`}
          onClick={() => setSidebarOpen(false)}
          className="truncate flex-1"
          title={conv.title}
        >
          {conv.title}
        </Link>
      )}
      <span className="text-[10px] text-muted-foreground shrink-0 group-hover:hidden flex items-center gap-1.5">
        {conv.messages?.length > 0 && (
          <span className="text-[9px] opacity-60">{conv.messages.length}</span>
        )}
        <span className="hidden sm:inline">{getRelativeTime(conv.createdAt)}</span>
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => {
            togglePinConversation(conv.id);
            toast.success(conv.pinned ? "Unpinned" : "Pinned");
          }}
          className="p-0.5 cursor-pointer"
          title={conv.pinned ? "Unpin" : "Pin"}
        >
          {conv.pinned ? (
            <PinOff className="h-3 w-3 text-accent" />
          ) : (
            <Pin className="h-3 w-3 text-muted-foreground hover:text-accent" />
          )}
        </button>
        {editingId === conv.id ? (
          <button
            onClick={() => commitRename(conv.id)}
            className="p-0.5 cursor-pointer"
          >
            <Check className="h-3 w-3 text-accent" />
          </button>
        ) : (
          <button
            onClick={() => startRename(conv.id, conv.title)}
            className="p-0.5 cursor-pointer"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
        <button
          onClick={() => handleDelete(conv.id)}
          className="p-0.5 cursor-pointer"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
