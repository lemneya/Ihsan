import { streamText, UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { ModelProvider } from "@/lib/models";

export const maxDuration = 60;

function getModel(provider: ModelProvider, modelId: string) {
  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "openai":
      return openai(modelId);
    case "google":
      return google(modelId);
    default:
      return anthropic("claude-sonnet-4-5-20250929");
  }
}

// Convert UI messages (parts format) to model messages (content format)
function convertMessages(uiMessages: UIMessage[]) {
  return uiMessages.map((msg) => {
    const textParts = msg.parts?.filter(
      (p): p is { type: "text"; text: string } => p.type === "text"
    );
    const textContent =
      textParts?.map((p) => p.text).join("") ||
      (msg as unknown as { content?: string }).content ||
      "";

    return {
      role: msg.role as "user" | "assistant",
      content: textContent,
    };
  });
}

export async function POST(req: Request) {
  const {
    messages,
    provider = "anthropic",
    modelId = "claude-sonnet-4-5-20250929",
  } = await req.json();

  const model = getModel(provider as ModelProvider, modelId);
  const convertedMessages = convertMessages(messages);

  const result = streamText({
    model,
    system: `You are Ihsan, an AI-powered search and assistant platform. You provide comprehensive, well-structured answers to user questions.

Your responses should be:
- Well-organized with clear headings and sections when appropriate
- Informative and thorough, like a mini wiki page (Sparkpage)
- Use markdown formatting for readability (headers, lists, bold, code blocks, tables)
- Include relevant context and nuance
- Be conversational yet professional
- When discussing factual topics, structure responses with key points, details, and context
- Use bullet points and numbered lists for clarity

You are helpful, accurate, and strive for excellence (Ihsan means excellence/perfection in Arabic).`,
    messages: convertedMessages,
  });

  return result.toUIMessageStreamResponse();
}
