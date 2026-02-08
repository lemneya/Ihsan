"use strict";
/**
 * memory-manager.ts — The Cortex
 *
 * Persistent memory layer for the IhsanAgent. Handles:
 *   - User facts (long-term):  memory/user.md
 *   - Conversation history (short-term): memory/short_term.json
 *
 * Memory survives server restarts. The agent remembers your name,
 * preferences, and recent conversation context across sessions.
 *
 * Design decisions:
 *   - Short-term memory is capped at MAX_TURNS to prevent unbounded growth.
 *   - User facts are appended as markdown bullets — human-readable on disk.
 *   - loadContext() returns a pre-formatted string ready for the system prompt.
 *   - All I/O goes through fs/promises — no in-memory caching between calls.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
// ─── Constants ──────────────────────────────────────────────────────
const BASE_MEMORY_DIR = (0, node_path_1.join)(process.cwd(), "memory");
const MAX_TURNS = 20;
const LOG_PREFIX = "[Memory]";
// ─── MemoryManager ──────────────────────────────────────────────────
class MemoryManager {
    memoryDir;
    userFactsFile;
    shortTermFile;
    /**
     * @param threadId — Optional thread ID for per-user memory isolation.
     *   When provided (e.g. "whatsapp:+17573394946"), memory is scoped
     *   to memory/threads/<sanitized-id>/ so each user gets their own
     *   conversation history and facts.
     */
    constructor(threadId) {
        if (threadId) {
            const safeId = threadId.replace(/[^a-zA-Z0-9_+-]/g, "_");
            this.memoryDir = (0, node_path_1.join)(BASE_MEMORY_DIR, "threads", safeId);
        }
        else {
            this.memoryDir = BASE_MEMORY_DIR;
        }
        this.userFactsFile = (0, node_path_1.join)(this.memoryDir, "user.md");
        this.shortTermFile = (0, node_path_1.join)(this.memoryDir, "short_term.json");
    }
    /** Ensure the memory directory exists before writing */
    async ensureDir() {
        await (0, promises_1.mkdir)(this.memoryDir, { recursive: true });
    }
    // ── Load Context ────────────────────────────────────────────────
    /**
     * Load full memory context from disk.
     * Returns user facts + recent conversation history,
     * pre-formatted for injection into the system prompt.
     */
    async loadContext() {
        const userFacts = await this.readUserFacts();
        const conversationHistory = await this.readConversationHistory();
        const sections = [];
        // User facts section — extract real fact lines (skip template placeholders)
        const realFacts = userFacts
            .split("\n")
            .filter((line) => /^- /.test(line) && !line.includes("(none yet)"))
            .join("\n");
        if (realFacts.trim()) {
            sections.push(`[USER MEMORY — Long-Term Facts]\n${realFacts}`);
        }
        // Conversation history section
        if (conversationHistory.length > 0) {
            const historyLines = conversationHistory.map((turn) => {
                const prefix = turn.role === "user" ? "User" : "Ihsan";
                // Truncate long messages to keep prompt lean
                const content = turn.content.length > 300
                    ? turn.content.slice(0, 300) + "..."
                    : turn.content;
                return `[${prefix}]: ${content}`;
            });
            sections.push(`[CONVERSATION HISTORY — Recent ${conversationHistory.length} turns]\n` +
                historyLines.join("\n"));
        }
        return {
            userFacts,
            conversationHistory,
            formatted: sections.length > 0 ? sections.join("\n\n---\n\n") : "",
        };
    }
    // ── Save Interaction ────────────────────────────────────────────
    /**
     * Append a conversation turn to short-term memory.
     * Automatically trims to MAX_TURNS (oldest entries dropped).
     */
    async saveInteraction(role, content) {
        if (!content.trim())
            return;
        const history = await this.readConversationHistory();
        history.push({
            role,
            content: content.trim(),
            timestamp: new Date().toISOString(),
        });
        // Trim to last MAX_TURNS entries
        const trimmed = history.length > MAX_TURNS
            ? history.slice(history.length - MAX_TURNS)
            : history;
        try {
            await this.ensureDir();
            await (0, promises_1.writeFile)(this.shortTermFile, JSON.stringify(trimmed, null, 2) + "\n", "utf-8");
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`${LOG_PREFIX} Failed to save interaction: ${message}`);
        }
    }
    // ── Update User Fact ────────────────────────────────────────────
    /**
     * Append a learned fact to the long-term user memory file.
     * Facts are stored as markdown bullet points for human readability.
     *
     * Example: "User prefers dark mode" → appends "- User prefers dark mode\n"
     */
    async updateUserFact(fact) {
        if (!fact.trim())
            return;
        const cleanFact = fact.trim();
        // Ensure it starts with a bullet
        const formatted = cleanFact.startsWith("- ") ? cleanFact : `- ${cleanFact}`;
        try {
            // Read existing content to avoid duplicates
            const existing = await this.readUserFacts();
            // Skip if the fact already exists (exact match, case-insensitive)
            if (existing.toLowerCase().includes(cleanFact.toLowerCase())) {
                console.log(`${LOG_PREFIX} Fact already known: "${cleanFact}"`);
                return;
            }
            await this.ensureDir();
            await (0, promises_1.appendFile)(this.userFactsFile, `${formatted}\n`, "utf-8");
            console.log(`${LOG_PREFIX} Learned new fact: "${cleanFact}"`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`${LOG_PREFIX} Failed to save user fact: ${message}`);
        }
    }
    // ── Summary ─────────────────────────────────────────────────────
    /**
     * Return a short summary string for logging.
     */
    async getSummary() {
        const facts = await this.readUserFacts();
        const history = await this.readConversationHistory();
        // Count real facts (exclude template placeholders)
        const realFactCount = facts
            .split("\n")
            .filter((line) => /^- /.test(line) && !line.includes("(none yet)"))
            .length;
        return `${realFactCount} fact(s), ${history.length} conversation turn(s)`;
    }
    // ── Private Helpers ─────────────────────────────────────────────
    async readUserFacts() {
        try {
            return await (0, promises_1.readFile)(this.userFactsFile, "utf-8");
        }
        catch {
            return "";
        }
    }
    async readConversationHistory() {
        try {
            const raw = await (0, promises_1.readFile)(this.shortTermFile, "utf-8");
            const parsed = JSON.parse(raw);
            // Handle both old format (metadata-only) and new format (conversation turns)
            if (!Array.isArray(parsed))
                return [];
            // Filter to only valid conversation turns (skip old metadata entries)
            return parsed.filter((entry) => entry &&
                typeof entry === "object" &&
                (entry.role === "user" || entry.role === "assistant") &&
                typeof entry.content === "string");
        }
        catch {
            return [];
        }
    }
}
exports.MemoryManager = MemoryManager;
