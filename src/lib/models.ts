export type ModelProvider = "anthropic" | "openai" | "google";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  modelId: string;
  description: string;
  icon: string;
}

export const models: ModelConfig[] = [
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    provider: "anthropic",
    modelId: "claude-sonnet-4-5-20250929",
    description: "Fast and intelligent",
    icon: "🟣",
  },
  {
    id: "claude-opus",
    name: "Claude Opus",
    provider: "anthropic",
    modelId: "claude-opus-4-6",
    description: "Most capable reasoning",
    icon: "🔮",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
    description: "Versatile and fast",
    icon: "🟢",
  },
  {
    id: "gemini-2",
    name: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash",
    description: "Google's multimodal model",
    icon: "🔵",
  },
];

export const defaultModel = models[0];
