import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { agentTools } from "@/lib/agent-tools";
import fs from "node:fs";
import path from "node:path";

export const maxDuration = 120;

// Load persona .md files from src/lib/agent-persona/
// These define the agent's identity, soul, memory protocol, tools reference, etc.
const PERSONA_DIR = path.join(process.cwd(), "src/lib/agent-persona");
const PERSONA_FILES = [
  "IDENTITY.md",
  "SOUL.md",
  "AGENTS.md",
  "MEMORY.md",
  "HEARTBEAT.md",
  "TOOLS.md",
  "USER.md",
] as const;

function loadPersona(): string {
  const sections: string[] = [];
  for (const file of PERSONA_FILES) {
    try {
      const content = fs.readFileSync(path.join(PERSONA_DIR, file), "utf-8");
      sections.push(content.trim());
    } catch {
      // File missing — skip silently
    }
  }
  return sections.join("\n\n---\n\n");
}

const AGENT_SYSTEM_PROMPT = loadPersona();

export async function POST(req: Request) {
  try {
    const { task, mode } = await req.json();

    if (!task || typeof task !== "string" || task.trim().length === 0) {
      return Response.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    const isDeep = mode === "deep";
    const maxSteps = isDeep ? 10 : 5;
    const deepPrefix = isDeep
      ? "\n\n[DEEP RESEARCH MODE] Be extra thorough: search with 3-5 different queries, fetch 5-8 sources, cross-reference extensively, and produce a comprehensive report with inline citations.\n\n"
      : "";

    const model = anthropic("claude-sonnet-4-5-20250929");

    const result = streamText({
      model,
      system: AGENT_SYSTEM_PROMPT + deepPrefix,
      messages: [{ role: "user", content: task }],
      tools: agentTools,
      stopWhen: stepCountIs(maxSteps),
      maxOutputTokens: isDeep ? 32000 : 16000,
    });

    // Create SSE stream from fullStream with heartbeat keep-alive
    const encoder = new TextEncoder();
    let stepIndex = 0;

    const stream = new ReadableStream({
      async start(controller) {
        // Heartbeat: send periodic pings to keep the connection alive
        // during long tool executions (prevents proxy/browser timeouts)
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            // Controller may be closed — ignore
          }
        }, 15000);

        try {
          for await (const event of result.fullStream) {
            let sseData: string | null = null;

            switch (event.type) {
              case "text-delta":
                sseData = JSON.stringify({
                  type: "text-delta",
                  text: event.text,
                });
                break;

              case "tool-call":
                sseData = JSON.stringify({
                  type: "tool-call",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  args: event.input,
                });
                break;

              case "tool-result":
                sseData = JSON.stringify({
                  type: "tool-result",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  result: event.output,
                });
                break;

              case "tool-error":
                sseData = JSON.stringify({
                  type: "tool-error",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  error:
                    event.error instanceof Error
                      ? event.error.message
                      : String(event.error),
                });
                break;

              case "finish-step":
                sseData = JSON.stringify({
                  type: "step-finish",
                  stepIndex: stepIndex++,
                });
                break;

              case "finish":
                sseData = JSON.stringify({
                  type: "finish",
                  finishReason: event.finishReason,
                  totalSteps: stepIndex,
                });
                break;

              case "error":
                sseData = JSON.stringify({
                  type: "error",
                  error:
                    event.error instanceof Error
                      ? event.error.message
                      : String(event.error),
                });
                break;
            }

            if (sseData) {
              controller.enqueue(
                encoder.encode(`data: ${sseData}\n\n`)
              );
            }
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
            )
          );
        } finally {
          clearInterval(heartbeat);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Agent API Error]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
