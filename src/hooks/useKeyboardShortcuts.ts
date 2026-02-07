import { useEffect } from "react";

interface ShortcutHandlers {
  onCommandK?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onCommandK, onEscape }: ShortcutHandlers) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onCommandK?.();
      }

      // Escape
      if (e.key === "Escape") {
        onEscape?.();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCommandK, onEscape]);
}
