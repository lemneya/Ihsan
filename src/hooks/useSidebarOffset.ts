import { useAppStore } from "@/lib/store";
import { useMediaQuery } from "./useMediaQuery";

export function useSidebarOffset(): string {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const expanded = useAppStore((s) => s.desktopSidebarExpanded);

  if (!isDesktop) return "";
  return expanded ? "md:ml-[320px]" : "md:ml-[60px]";
}
