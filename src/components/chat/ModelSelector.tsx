"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { models, ModelConfig } from "@/lib/models";

interface ModelSelectorProps {
  selected: ModelConfig;
  onChange: (model: ModelConfig) => void;
}

export default function ModelSelector({
  selected,
  onChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
      >
        <span>{selected.icon}</span>
        <span className="hidden sm:inline">{selected.name}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-border bg-card shadow-lg p-1 z-50 animate-fade-in">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted cursor-pointer",
                selected.id === model.id && "bg-muted"
              )}
            >
              <span className="text-lg">{model.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-muted-foreground">
                  {model.description}
                </div>
              </div>
              {selected.id === model.id && (
                <Check className="h-4 w-4 text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
