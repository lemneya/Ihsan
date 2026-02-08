"use strict";
/**
 * agent.ts — The IhsanAgent Class
 *
 * This is the brain. It replaces the inline logic in server/index.ts.
 * Each connection gets its own IhsanAgent instance.
 *
 * Phase 11: Interface-agnostic. The agent no longer depends on socket.io.
 * It communicates through a StreamInterface, which can be backed by
 * WebSocket (SocketAdapter), HTTP (HttpAdapter), or any future transport.
 *
 * Lifecycle:
 *   1. new IhsanAgent(stream) — bind to a transport adapter
 *   2. await agent.wakeUp()   — read identity + soul from /config
 *   3. await agent.execute()  — run a task (research, build, deliver)
 *   4. agent.abort()          — user hits stop
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IhsanAgent = void 0;
const ai_1 = require("ai");
const anthropic_1 = require("@ai-sdk/anthropic");
const fs_adapter_1 = require("./fs-adapter");
const cognition_1 = require("./cognition");
const agent_tools_1 = require("../lib/agent-tools");
const skill_loader_1 = require("../lib/skill-loader");
const memory_manager_1 = require("./memory-manager");
// ─── IhsanAgent ─────────────────────────────────────────────────────
class IhsanAgent {
    stream;
    identity = "";
    soul = "";
    operationalPrompt = "";
    controller = null;
    skillRegistry;
    memory = new memory_manager_1.MemoryManager();
    constructor(stream, registry, threadId) {
        this.stream = stream;
        this.skillRegistry = registry;
        this.memory = new memory_manager_1.MemoryManager(threadId);
    }
    // ── wakeUp — read personality from disk ───────────────────────────
    async wakeUp() {
        this.stream.send("agent:log", { message: "I am awake. Reading identity..." });
        // Read editable personality from /config (real files on disk)
        this.identity = await (0, fs_adapter_1.readConfig)("identity.md");
        this.soul = await (0, fs_adapter_1.readConfig)("soul.md");
        // Read operational instructions from src/lib/agent-persona/
        this.operationalPrompt = await (0, fs_adapter_1.loadOperationalPersona)();
        // Load persistent memory from disk
        const memorySummary = await this.memory.getSummary();
        this.stream.send("agent:log", {
            message: `[Memory] Context loaded: ${memorySummary}`,
        });
        // Report dynamic skills from the shared global registry (pre-loaded at server start)
        const dynamicSkills = this.skillRegistry.getEnabledSkills();
        if (dynamicSkills.length > 0) {
            this.stream.send("agent:log", {
                message: `Dynamic skills available: ${dynamicSkills.map((s) => s.name).join(", ")}`,
            });
        }
        const nameMatch = this.identity.match(/\*\*Name:\*\*\s*(.+)/);
        const name = nameMatch ? nameMatch[1].trim() : "Ihsan Agent";
        this.stream.send("agent:log", { message: `Identity loaded: ${name}` });
    }
    // ── buildSystemPrompt — assemble the full prompt from disk ────────
    async buildSystemPrompt(options) {
        const sections = [];
        // 1. Identity + Soul (from /config — editable on disk)
        if (this.identity)
            sections.push(this.identity);
        if (this.soul)
            sections.push(this.soul);
        // 2. Operational persona (AGENTS.md, TOOLS.md, etc.)
        if (this.operationalPrompt)
            sections.push(this.operationalPrompt);
        // 3. Persistent memory context (user facts + conversation history)
        const memoryContext = await this.memory.loadContext();
        if (memoryContext.formatted) {
            sections.push(memoryContext.formatted);
        }
        // 4. Deep research prefix
        if (options.mode === "deep") {
            sections.push("[DEEP RESEARCH MODE] Be extra thorough: search with 3-5 different queries, " +
                "fetch 5-8 sources, cross-reference extensively, and produce a comprehensive " +
                "report with inline citations.");
        }
        // 5. Active skills context (with workflows + quality gates)
        if (options.skills && options.skills.length > 0) {
            const enabledSkills = options.skills.filter((s) => s.enabled);
            const skillsContext = (0, skill_loader_1.buildSkillsContext)(enabledSkills);
            if (skillsContext)
                sections.push(skillsContext);
        }
        // 6. Dynamic skills context (hot-loaded from /skills/*.ts)
        const dynamicContext = this.skillRegistry.getSkillsPromptContext();
        if (dynamicContext)
            sections.push(dynamicContext);
        return sections.join("\n\n---\n\n");
    }
    // ── execute — run a full agent task ───────────────────────────────
    async execute(prompt, options = {}) {
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
        const model = (0, anthropic_1.anthropic)("claude-sonnet-4-5-20250929");
        let stepIndex = 0;
        let fullAssistantText = "";
        // Save user prompt to conversation history
        await this.memory.saveInteraction("user", prompt.trim());
        try {
            const result = (0, ai_1.streamText)({
                model,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt.trim() }],
                tools: allTools,
                stopWhen: (0, ai_1.stepCountIs)(maxSteps),
                maxOutputTokens: isDeep ? 32000 : 16000,
                abortSignal: this.controller.signal,
            });
            for await (const event of result.fullStream) {
                if (this.controller.signal.aborted)
                    break;
                switch (event.type) {
                    case "text-delta":
                        fullAssistantText += event.text;
                        this.stream.send("agent:text-delta", { text: event.text });
                        break;
                    case "tool-call":
                        this.stream.send("agent:tool-call", {
                            toolCallId: event.toolCallId,
                            toolName: event.toolName,
                            args: event.input,
                        });
                        break;
                    case "tool-result": {
                        const output = event.output;
                        // ── STREAM_SLIDES interceptor ────────────────────────
                        // If the dynamic generate_slides skill returned the
                        // STREAM_SLIDES marker, delegate to real-time streaming
                        // instead of passing the raw marker to the frontend.
                        if (output &&
                            typeof output === "object" &&
                            output._action === "STREAM_SLIDES") {
                            const slideTopic = String(output.topic || prompt);
                            // Emit the tool-call event so the frontend "sees" generate_slides
                            // (the Phase 5 useEffect triggers the view switch on this)
                            this.stream.send("agent:tool-result", {
                                toolCallId: event.toolCallId,
                                toolName: "generate_slides",
                                result: { status: "streaming", topic: slideTopic },
                            });
                            // Fire the real-time slide streamer (emits slides:state,
                            // slides:log, slides:slide events on this same socket)
                            await this.generateSlides(slideTopic);
                            break;
                        }
                        // Default: pass tool result through to the frontend
                        this.stream.send("agent:tool-result", {
                            toolCallId: event.toolCallId,
                            toolName: event.toolName,
                            result: output,
                        });
                        break;
                    }
                    case "tool-error":
                        this.stream.send("agent:tool-error", {
                            toolCallId: event.toolCallId,
                            toolName: event.toolName,
                            error: event.error instanceof Error
                                ? event.error.message
                                : String(event.error),
                        });
                        break;
                    case "finish-step":
                        this.stream.send("agent:step-finish", { stepIndex: stepIndex++ });
                        break;
                    case "finish":
                        this.stream.send("agent:finish", {
                            finishReason: event.finishReason,
                            totalSteps: stepIndex,
                        });
                        break;
                    case "error":
                        this.stream.send("agent:error", {
                            error: event.error instanceof Error
                                ? event.error.message
                                : String(event.error),
                        });
                        break;
                }
            }
            // ── System 2: Think → Critique → Refine ─────────────────────
            if (fullAssistantText.trim()) {
                try {
                    console.log("[System 2] Running critic...");
                    this.stream.send("agent:log", { message: "[System 2] Running critic..." });
                    const criticResult = await (0, cognition_1.criticize)(fullAssistantText, prompt);
                    const scoreMsg = `[System 2] Score: ${criticResult.score}/100 (G:${criticResult.grounding} S:${criticResult.safety} C:${criticResult.completeness})`;
                    console.log(scoreMsg);
                    this.stream.send("agent:log", { message: scoreMsg });
                    if (criticResult.score < cognition_1.QUALITY_THRESHOLD) {
                        console.log(`[System 2] Below threshold (${cognition_1.QUALITY_THRESHOLD}), refining...`);
                        this.stream.send("agent:log", {
                            message: `[System 2] Below threshold (${cognition_1.QUALITY_THRESHOLD}), refining...`,
                        });
                        const refinedText = await (0, cognition_1.refine)(fullAssistantText, criticResult.instructions, prompt);
                        fullAssistantText = refinedText;
                        // Emit refined text so adapters can prefer it over streamed deltas
                        this.stream.send("agent:refined", { text: refinedText });
                        console.log("[System 2] Refinement complete.");
                        this.stream.send("agent:log", { message: "[System 2] Refinement complete." });
                    }
                    else {
                        console.log("[System 2] Draft passed quality gate.");
                        this.stream.send("agent:log", { message: "[System 2] Draft passed quality gate." });
                    }
                }
                catch (cognitionErr) {
                    // Cognition loop failure is non-fatal — the original draft stands
                    const msg = cognitionErr instanceof Error ? cognitionErr.message : "Cognition error";
                    console.log(`[System 2] Critic skipped: ${msg}`);
                    this.stream.send("agent:log", { message: `[System 2] Critic skipped: ${msg}` });
                }
            }
            // Save assistant response to conversation history
            if (fullAssistantText.trim()) {
                await this.memory.saveInteraction("assistant", fullAssistantText.trim());
            }
        }
        catch (err) {
            if (this.controller.signal.aborted)
                return;
            const message = err instanceof Error ? err.message : "Stream error";
            this.stream.send("agent:error", { error: message });
        }
        finally {
            this.controller = null;
        }
    }
    // ── generateSlides — real AI streaming for slides:generate ────────
    async generateSlides(prompt) {
        this.abort();
        this.controller = new AbortController();
        this.stream.send("slides:state", { status: "starting" });
        this.stream.send("slides:log", { message: "Starting AI slide generation..." });
        this.stream.send("slides:log", { message: "Loading spec and style tokens..." });
        const systemPrompt = agent_tools_1.ihsanToolPrompts["slides"];
        if (!systemPrompt) {
            this.stream.send("slides:log", { message: "Error: slides prompt not found" });
            this.stream.send("slides:state", { status: "done" });
            return;
        }
        const model = (0, anthropic_1.anthropic)("claude-sonnet-4-5-20250929");
        try {
            this.stream.send("slides:state", { status: "generating" });
            this.stream.send("slides:log", { message: "AI model is generating slides..." });
            const result = (0, ai_1.streamText)({
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
                if (this.controller.signal.aborted)
                    break;
                buffer += chunk;
                // Slides are delimited by "\n---\n" in the AI output
                const parts = buffer.split(/\n---\n/);
                // Process all complete slides (everything except the last partial chunk)
                while (parts.length > 1) {
                    const slideText = parts.shift();
                    const parsed = this.parseSlideChunk(slideText);
                    if (parsed) {
                        this.stream.send("slides:slide", {
                            index: slideIndex,
                            total: -1,
                            content: parsed,
                        });
                        this.stream.send("slides:log", {
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
                    this.stream.send("slides:slide", {
                        index: slideIndex,
                        total: slideIndex + 1,
                        content: parsed,
                    });
                    this.stream.send("slides:log", {
                        message: `Generated slide ${slideIndex + 1}: ${parsed.title}`,
                    });
                    slideIndex++;
                }
            }
            // Update totals on all previously emitted slides
            this.stream.send("slides:log", {
                message: `Presentation complete: ${slideIndex} slides generated.`,
            });
            this.stream.send("slides:state", { status: "done" });
            this.stream.send("slides:log", { message: "Presentation ready for download." });
        }
        catch (err) {
            if (this.controller.signal.aborted)
                return;
            const message = err instanceof Error ? err.message : "Slide generation failed";
            this.stream.send("slides:log", { message: `Error: ${message}` });
            this.stream.send("slides:state", { status: "done" });
        }
        finally {
            this.controller = null;
        }
    }
    // ── abort — cancel the current run ────────────────────────────────
    abort() {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }
    // ── Private helpers ───────────────────────────────────────────────
    /** Parse a raw slide markdown chunk into { title, subtitle, bullet } */
    parseSlideChunk(raw) {
        const trimmed = raw.trim();
        if (!trimmed)
            return null;
        // Extract title: "## Slide N: Title" or "## Title"
        const titleMatch = trimmed.match(/^##\s+(?:Slide\s+\d+:\s*)?(.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : "";
        if (!title)
            return null;
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
    getEnabledTools(skills) {
        const CORE_TOOLS = ["web_search", "web_fetch", "run_javascript", "create_artifact", "create_diagram"];
        const enabled = new Set(CORE_TOOLS);
        for (const skill of skills) {
            if (skill.enabled) {
                for (const t of skill.tools)
                    enabled.add(t);
            }
        }
        const filtered = {};
        for (const key of enabled) {
            if (key in agent_tools_1.agentTools) {
                filtered[key] = agent_tools_1.agentTools[key];
            }
        }
        return filtered;
    }
}
exports.IhsanAgent = IhsanAgent;
