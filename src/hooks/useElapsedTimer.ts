"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Hook that counts elapsed seconds while `isRunning` is true.
 * Resets when `isRunning` transitions from false → true.
 * Returns a formatted string like "0:05", "2:13".
 */
export function useElapsedTimer(isRunning: boolean): string {
  const [seconds, setSeconds] = useState(0);
  const prevRunning = useRef(false);

  // Reset when transitioning to running
  useEffect(() => {
    if (isRunning && !prevRunning.current) {
      setSeconds(0);
    }
    prevRunning.current = isRunning;
  }, [isRunning]);

  // Tick every second while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
