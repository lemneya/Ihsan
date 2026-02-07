"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex mb-6 animate-fade-in">
      <div className="flex items-start gap-3 max-w-[85%]">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mt-0.5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
