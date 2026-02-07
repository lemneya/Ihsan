import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ModelConfig, defaultModel } from "./models";
import type { AgentRunState } from "./agent-types";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  model: ModelConfig;
  messages: StoredMessage[];
  pinned?: boolean;
}

export interface AgentTask {
  id: string;
  title: string;
  task: string;
  createdAt: number;
  mode: "normal" | "deep";
  status: "running" | "completed" | "error";
  stepsCount: number;
  runState: AgentRunState;
}

type Theme = "light" | "dark" | "system";

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  desktopSidebarExpanded: boolean;
  setDesktopSidebarExpanded: (open: boolean) => void;
  toggleDesktopSidebar: () => void;

  // Settings
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Default model
  defaultModel: ModelConfig;
  setDefaultModel: (model: ModelConfig) => void;

  // Conversations
  conversations: Conversation[];
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  clearAllConversations: () => void;

  // Agent Tasks
  agentTasks: AgentTask[];
  addAgentTask: (task: AgentTask) => void;
  updateAgentTask: (id: string, updates: Partial<AgentTask>) => void;
  deleteAgentTask: (id: string) => void;
  getAgentTask: (id: string) => AgentTask | undefined;
}

function stripLargeToolResults(runState: AgentRunState): AgentRunState {
  return {
    ...runState,
    steps: runState.steps.map((step) => ({
      ...step,
      toolCalls: step.toolCalls.map((tc) => {
        if (!tc.result) return tc;
        const resultStr = JSON.stringify(tc.result);
        if (resultStr.length > 5000) {
          const data = tc.result as Record<string, unknown>;
          if (typeof data.content === "string") {
            return { ...tc, result: { ...data, content: data.content.slice(0, 2000) + "\n\n[Truncated for storage]" } };
          }
          return { ...tc, result: "[Result truncated for storage]" };
        }
        return tc;
      }),
    })),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      desktopSidebarExpanded: false,
      setDesktopSidebarExpanded: (open) => set({ desktopSidebarExpanded: open }),
      toggleDesktopSidebar: () =>
        set((s) => ({ desktopSidebarExpanded: !s.desktopSidebarExpanded })),

      // Settings
      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      // Default model
      defaultModel,
      setDefaultModel: (model) => set({ defaultModel: model }),

      // Conversations
      conversations: [],
      addConversation: (conv) =>
        set((s) => ({
          conversations: [conv, ...s.conversations.filter((c) => c.id !== conv.id)],
        })),
      updateConversation: (id, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
        })),
      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),
      togglePinConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        })),
      getConversation: (id) => get().conversations.find((c) => c.id === id),
      clearAllConversations: () => set({ conversations: [] }),

      // Agent Tasks
      agentTasks: [],
      addAgentTask: (task) =>
        set((s) => ({
          agentTasks: [task, ...s.agentTasks.filter((t) => t.id !== task.id)].slice(0, 20),
        })),
      updateAgentTask: (id, updates) =>
        set((s) => ({
          agentTasks: s.agentTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteAgentTask: (id) =>
        set((s) => ({
          agentTasks: s.agentTasks.filter((t) => t.id !== id),
        })),
      getAgentTask: (id) => get().agentTasks.find((t) => t.id === id),
    }),
    {
      name: "ihsan-store",
      partialize: (state) => ({
        theme: state.theme,
        conversations: state.conversations,
        defaultModel: state.defaultModel,
        agentTasks: state.agentTasks.map((t) => ({
          ...t,
          runState: stripLargeToolResults(t.runState),
        })),
      }),
    }
  )
);

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
