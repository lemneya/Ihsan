"use client";

import { Toaster } from "react-hot-toast";
import ThemeProvider from "./ThemeProvider";
import CommandPalette from "@/components/command/CommandPalette";
import SettingsPanel from "@/components/settings/SettingsPanel";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-card !text-foreground !border !border-border !shadow-lg !rounded-xl !text-sm",
          duration: 2500,
        }}
      />
      <CommandPalette />
      <SettingsPanel />
    </ThemeProvider>
  );
}
