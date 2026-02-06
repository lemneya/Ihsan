"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  Code,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Zap,
  Globe,
  Brain,
} from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import { models, defaultModel, ModelConfig } from "@/lib/models";
import ModelSelector from "@/components/chat/ModelSelector";

const suggestions = [
  {
    icon: <Search className="h-4 w-4" />,
    text: "What are the latest advances in quantum computing?",
    color: "text-blue-500",
  },
  {
    icon: <Code className="h-4 w-4" />,
    text: "Explain React Server Components with examples",
    color: "text-green-500",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    text: "Summarize the key ideas of Stoic philosophy",
    color: "text-purple-500",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    text: "Help me plan a startup business strategy",
    color: "text-amber-500",
  },
];

const features = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Multi-Model Intelligence",
    desc: "Route queries to the best AI model",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Sparkpages",
    desc: "Rich, structured answers like a wiki",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Web-Aware",
    desc: "Search-integrated responses",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(defaultModel);

  const handleSubmit = (message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      q: message,
      provider: selectedModel.provider,
      model: selectedModel.modelId,
    });
    router.push(`/chat/${id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Ihsan</span>
        </div>
        <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto text-center"
        >
          {/* Logo & Title */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              What would you like to know?
            </h1>
            <p className="text-muted-foreground">
              Search, explore, and discover with AI-powered Sparkpages
            </p>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8"
          >
            <ChatInput
              onSubmit={handleSubmit}
              placeholder="Ask anything — get a comprehensive Sparkpage..."
              size="large"
            />
          </motion.div>

          {/* Suggestion chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(s.text)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span className={s.color}>{s.icon}</span>
                <span className="text-muted-foreground">{s.text}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-center gap-6"
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <span className="text-accent">{f.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">
                    {f.title}
                  </p>
                  <p className="text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by multi-model AI &middot; Built with excellence
      </footer>
    </div>
  );
}
