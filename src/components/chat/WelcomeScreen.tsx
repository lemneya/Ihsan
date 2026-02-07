"use client";

import { Sparkles, Code, Lightbulb, BookOpen, Palette } from "lucide-react";

interface WelcomeScreenProps {
  onSelect: (prompt: string) => void;
}

const suggestions = [
  {
    icon: <Code className="h-4 w-4" />,
    title: "Write code",
    prompt: "Write a React component that shows a countdown timer",
    color: "text-purple-500",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    title: "Brainstorm ideas",
    prompt: "Give me 5 creative startup ideas for AI in education",
    color: "text-amber-500",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    title: "Explain a concept",
    prompt: "Explain how neural networks work in simple terms",
    color: "text-blue-500",
  },
  {
    icon: <Palette className="h-4 w-4" />,
    title: "Design help",
    prompt: "Create a color palette for a modern fintech app",
    color: "text-pink-500",
  },
];

export default function WelcomeScreen({ onSelect }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 pulse-glow">
        <Sparkles className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-1">How can I help you?</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Start a conversation or try one of these
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => onSelect(s.prompt)}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted hover:border-accent/20 transition-all text-left cursor-pointer group"
          >
            <div className={`mt-0.5 ${s.color} group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {s.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
