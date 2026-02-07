/**
 * agent.ts — The IhsanAgent Class
 *
 * This is the brain. It replaces the inline logic in server/index.ts.
 * Each socket connection gets its own IhsanAgent instance.
 *
 * Lifecycle:
 *   1. new IhsanAgent(socket) — bind to a client connection
 *   2. await agent.wakeUp()   — read identity + soul from /config
 *   3. await agent.execute()  — run a task (research, build, deliver)
 *   4. agent.abort()          — user hits stop
 */

import type { Socket } from "socket.io";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  readConfig,
  loadOperationalPersona,
} from "./fs-adapter";
import { agentTools, ihsanToolPrompts } from "../lib/agent-tools";
import { buildSkillsContext } from "../lib/skill-loader";
import { SkillRegistry } from "./skill-registry";
import { MemoryManager } from "./memory-manager";

// ─── Types ──────────────────────────────────────────────────────────

interface SkillEntry {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
  tools: string[];
  skillDir?: string;
}

interface ExecuteOptions {
  mode?: "deep";
  skills?: SkillEntry[];
}

// ─── IhsanAgent ─────────────────────────────────────────────────────

export class IhsanAgent {
  private socket: Socket;
  private identity = "";
  private soul = "";
  private operationalPrompt = "";
  private controller: AbortController | null = null;
  private skillRegistry: SkillRegistry;
  private memory = new MemoryManager();

  constructor(socket: Socket, registry: SkillRegistry) {
    this.socket = socket;
    this.skillRegistry = registry;
  }

  // ── wakeUp — read personality from disk ───────────────────────────

  async wakeUp(): Promise<void> {
    this.socket.emit("agent:log", { message: "I am awake. Reading identity..." });

    // Read editable personality from /config (real files on disk)
    this.identity = await readConfig("identity.md");
    this.soul = await readConfig("soul.md");

    // Read operational instructions from src/lib/agent-persona/
    this.operationalPrompt = await loadOperationalPersona();

    // Load persistent memory from disk
    const memorySummary = await this.memory.getSummary();
    this.socket.emit("agent:log", {
      message: `[Memory] Context loaded: ${memorySummary}`,
    });

    // Report dynamic skills from the shared global registry (pre-loaded at server start)
    const dynamicSkills = this.skillRegistry.getEnabledSkills();
    if (dynamicSkills.length > 0) {
      this.socket.emit("agent:log", {
        message: `Dynamic skills available: ${dynamicSkills.map((s) => s.name).join(", ")}`,
      });
    }

    const nameMatch = this.identity.match(/\*\*Name:\*\*\s*(.+)/);
    const name = nameMatch ? nameMatch[1].trim() : "Ihsan Agent";
    this.socket.emit("agent:log", { message: `Identity loaded: ${name}` });
  }

  // ── buildSystemPrompt — assemble the full prompt from disk ────────

  private async buildSystemPrompt(options: ExecuteOptions): Promise<string> {
    const sections: string[] = [];

    // 1. Identity + Soul (from /config — editable on disk)
    if (this.identity) sections.push(this.identity);
    if (this.soul) sections.push(this.soul);

    // 2. Operational persona (AGENTS.md, TOOLS.md, etc.)
    if (this.operationalPrompt) sections.push(this.operationalPrompt);

    // 3. Persistent memory context (user facts + conversation history)
    const memoryContext = await this.memory.loadContext();
    if (memoryContext.formatted) {
      sections.push(memoryContext.formatted);
    }

    // 4. Deep research prefix
    if (options.mode === "deep") {
      sections.push(
        "[DEEP RESEARCH MODE] Be extra thorough: search with 3-5 different queries, " +
        "fetch 5-8 sources, cross-reference extensively, and produce a comprehensive " +
        "report with inline citations."
      );
    }

    // 5. Active skills context (with workflows + quality gates)
    if (options.skills && options.skills.length > 0) {
      const enabledSkills = options.skills.filter((s) => s.enabled);
      const skillsContext = buildSkillsContext(enabledSkills);
      if (skillsContext) sections.push(skillsContext);
    }

    // 6. Dynamic skills context (hot-loaded from /skills/*.ts)
    const dynamicContext = this.skillRegistry.getSkillsPromptContext();
    if (dynamicContext) sections.push(dynamicContext);

    return sections.join("\n\n---\n\n");
  }

  // ── execute — run a full agent task ───────────────────────────────

  async execute(prompt: string, options: ExecuteOptions = {}): Promise<void> {
    // Abort any existing run
    this.abort();
    this.controller = new AbortController();

    const isDeep = options.mode === "deep";
    const maxSteps = isDeep ? 10 : 5;

    const systemPrompt = await this.buildSystemPrompt(options);

    // Filter tools to only enabled ones, then merge dynamic skills
    const enabledTools = this.getEnabledTools(options.skills || []);
    const dynamicTools = this.skillRegistry.getToolDefinitions();
    const allTools = { ...enabledTools, ...dynamicTools };

    const model = anthropic("claude-sonnet-4-5-20250929");

    let stepIndex = 0;
    let fullAssistantText = "";

    // Save user prompt to conversation history
    await this.memory.saveInteraction("user", prompt.trim());

    try {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt.trim() }],
        tools: allTools as typeof agentTools,
        stopWhen: stepCountIs(maxSteps),
        maxOutputTokens: isDeep ? 32000 : 16000,
        abortSignal: this.controller.signal,
      });

      for await (const event of result.fullStream) {
        if (this.controller.signal.aborted) break;

        switch (event.type) {
          case "text-delta":
            fullAssistantText += event.text;
            this.socket.emit("agent:text-delta", { text: event.text });
            break;

          case "tool-call":
            this.socket.emit("agent:tool-call", {
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              args: event.input,
            });
            break;

          case "tool-result":
            this.socket.emit("agent:tool-result", {
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              result: event.output,
            });
            break;

          case "tool-error":
            this.socket.emit("agent:tool-error", {
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              error:
                event.error instanceof Error
                  ? event.error.message
                  : String(event.error),
            });
            break;

          case "finish-step":
            this.socket.emit("agent:step-finish", { stepIndex: stepIndex++ });
            break;

          case "finish":
            this.socket.emit("agent:finish", {
              finishReason: event.finishReason,
              totalSteps: stepIndex,
            });
            break;

          case "error":
            this.socket.emit("agent:error", {
              error:
                event.error instanceof Error
                  ? event.error.message
                  : String(event.error),
            });
            break;
        }
      }

      // Save assistant response to conversation history
      if (fullAssistantText.trim()) {
        await this.memory.saveInteraction("assistant", fullAssistantText.trim());
      }
    } catch (err) {
      if (this.controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Stream error";
      this.socket.emit("agent:error", { error: message });
    } finally {
      this.controller = null;
    }
  }

  // ── generateSlides — real AI streaming for slides:generate ────────

  async generateSlides(prompt: string): Promise<void> {
    this.abort();
    this.controller = new AbortController();

    this.socket.emit("slides:state", { status: "starting" });
    this.socket.emit("slides:log", { message: "Starting AI slide generation..." });
    this.socket.emit("slides:log", { message: "Loading spec and style tokens..." });

    const systemPrompt = ihsanToolPrompts["slides"];
    if (!systemPrompt) {
      this.socket.emit("slides:log", { message: "Error: slides prompt not found" });
      this.socket.emit("slides:state", { status: "done" });
      return;
    }

    const model = anthropic("claude-sonnet-4-5-20250929");

    try {
      this.socket.emit("slides:state", { status: "generating" });
      this.socket.emit("slides:log", { message: "AI model is generating slides..." });

      const result = streamText({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
        maxOutputTokens: 16000,
        abortSignal: this.controller.signal,
      });

      // Stream and parse slides in real time
      let buffer = "";
      let slideIndex = 0;

      for await (const chunk of result.textStream) {
        if (this.controller.signal.aborted) break;
        buffer += chunk;

        // Slides are delimited by "\n---\n" in the AI output
        const parts = buffer.split(/\n---\n/);

        // Process all complete slides (everything except the last partial chunk)
        while (parts.length > 1) {
          const slideText = parts.shift()!;
          const parsed = this.parseSlideChunk(slideText);
          if (parsed) {
            this.socket.emit("slides:slide", {
              index: slideIndex,
              total: -1,
              content: parsed,
            });
            this.socket.emit("slides:log", {
              message: `Generated slide ${slideIndex + 1}: ${parsed.title}`,
            });
            slideIndex++;
          }
        }
        buffer = parts[0] || "";
      }

      // Handle the final slide remaining in the buffer
      if (buffer.trim()) {
        const parsed = this.parseSlideChunk(buffer);
        if (parsed) {
          this.socket.emit("slides:slide", {
            index: slideIndex,
            total: slideIndex + 1,
            content: parsed,
          });
          this.socket.emit("slides:log", {
            message: `Generated slide ${slideIndex + 1}: ${parsed.title}`,
          });
          slideIndex++;
        }
      }

      // Update totals on all previously emitted slides
      this.socket.emit("slides:log", {
        message: `Presentation complete: ${slideIndex} slides generated.`,
      });
      this.socket.emit("slides:state", { status: "done" });
      this.socket.emit("slides:log", { message: "Presentation ready for download." });
    } catch (err) {
      if (this.controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Slide generation failed";
      this.socket.emit("slides:log", { message: `Error: ${message}` });
      this.socket.emit("slides:state", { status: "done" });
    } finally {
      this.controller = null;
    }
  }

  // ── abort — cancel the current run ────────────────────────────────

  abort(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /** Parse a raw slide markdown chunk into { title, subtitle, bullet } */
  private parseSlideChunk(raw: string): { title: string; subtitle: string; bullet: string } | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Extract title: "## Slide N: Title" or "## Title"
    const titleMatch = trimmed.match(/^##\s+(?:Slide\s+\d+:\s*)?(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (!title) return null;

    // Extract bullet lines (lines starting with "- ")
    const bullets = trimmed
      .split("\n")
      .filter((line) => /^\s*-\s+/.test(line))
      .map((line) => line.replace(/^\s*-\s+/, "").trim());

    const subtitle = bullets[0] || "";
    const bullet = bullets.slice(1).join(" | ") || "";

    return { title, subtitle, bullet };
  }

  /** Filter agentTools to only enabled tool keys */
  private getEnabledTools(skills: SkillEntry[]): Record<string, unknown> {
    const CORE_TOOLS = ["web_search", "web_fetch", "run_javascript", "create_artifact", "create_diagram"];
    const enabled = new Set<string>(CORE_TOOLS);
    for (const skill of skills) {
      if (skill.enabled) {
        for (const t of skill.tools) enabled.add(t);
      }
    }
    const filtered: Record<string, unknown> = {};
    for (const key of enabled) {
      if (key in agentTools) {
        filtered[key] = (agentTools as Record<string, unknown>)[key];
      }
    }
    return filtered;
  }
}
