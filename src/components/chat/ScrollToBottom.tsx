"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ScrollToBottom({ containerRef }: ScrollToBottomProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShow(scrollHeight - scrollTop - clientHeight > 200);
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-30"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
