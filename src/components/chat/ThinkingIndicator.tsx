"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 mb-6 animate-fade-in">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-accent" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <span>Thinking...</span>
      </div>
    </div>
  );
}
