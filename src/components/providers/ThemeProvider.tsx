"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(resolvedTheme: "light" | "dark") {
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mql.matches ? "dark" : "light");

      function handler(e: MediaQueryListEvent) {
        applyTheme(e.matches ? "dark" : "light");
      }
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
