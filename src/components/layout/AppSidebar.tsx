"use client";

import { cn } from "@/lib/utils";
import {
  SquarePlus,
  Home,
  Mail,
  Network,
  HardDrive,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: SquarePlus, label: "New", href: "/" },
  { icon: Home, label: "Home", href: "/" },
  { icon: Mail, label: "AI Inbox", href: "#" },
  { icon: Network, label: "Hub", href: "#" },
  { icon: HardDrive, label: "AI Drive", href: "#" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[60px] bg-white dark:bg-[#18181b] border-r border-gray-100 dark:border-zinc-800 flex flex-col items-center py-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href && item.label !== "New";
        return (
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

      {/* Bottom user icon */}
      <div className="mt-auto">
        <button className="flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1 cursor-pointer">
          <div className="p-1.5">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </button>
      </div>
    </aside>
  );
}
