"use client";

import { X, Keyboard } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { models } from "@/lib/models";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, defaultModel, setDefaultModel, clearAllConversations, conversations } = useAppStore();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Appearance */}
            <div>
              <h3 className="text-sm font-medium mb-3">Appearance</h3>
              <ThemeToggle />
            </div>

            {/* Default Model */}
            <div>
              <h3 className="text-sm font-medium mb-3">Default Model</h3>
              <div className="space-y-1">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setDefaultModel(model)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                      defaultModel.id === model.id
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{model.icon}</span>
                    <span className="flex-1 text-left">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { keys: "⌘ K", action: "Open command palette" },
                  { keys: "Esc", action: "Stop generation / Close" },
                  { keys: "Enter", action: "Send message" },
                  { keys: "Shift+Enter", action: "New line" },
                ].map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{shortcut.action}</span>
                    <kbd className="px-2 py-1 rounded-md bg-muted text-xs font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Data */}
            <div>
              <h3 className="text-sm font-medium mb-3">Data</h3>
              <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                <span>{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</span>
                <span>{conversations.reduce((sum, c) => sum + (c.messages?.length ?? 0), 0)} messages</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50"
                onClick={() => {
                  if (confirm("Clear all conversations? This cannot be undone.")) {
                    clearAllConversations();
                    toast.success("All conversations cleared");
                  }
                }}
              >
                Clear all conversations
              </Button>
            </div>

            {/* About */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Ihsan AI Workspace — Your all-in-one AI assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
