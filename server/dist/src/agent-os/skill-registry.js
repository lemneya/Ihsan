"use strict";
/**
 * skill-registry.ts — The Nervous System
 *
 * Hot-swappable plugin loader. Scans /skills for .ts files,
 * dynamically imports each one, validates it against the Skill
 * interface, and registers it.
 *
 * Drop a new .ts file into /skills → restart → the agent has a new capability.
 *
 * Phase 3 upgrade: now a global singleton shared across all agent
 * instances and API endpoints. Tracks enabled/disabled state per
 * skill, supports toggling, and serializes to JSON for the API.
 *
 * Design decisions:
 *   - Uses dynamic import() so skills are loaded at runtime, not compile time.
 *   - Validates every import with isValidSkill() — malformed files are
 *     skipped with a warning, never crash the server.
 *   - Converts each Skill into a Vercel AI SDK tool() definition so
 *     the agent can use it natively alongside core tools.
 *   - Only enabled skills are injected into the LLM call.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillRegistry = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const ai_1 = require("ai");
const skill_interface_1 = require("./types/skill.interface");
// ─── Constants ──────────────────────────────────────────────────────
const SKILLS_DIR = (0, node_path_1.join)(process.cwd(), "skills");
const LOG_PREFIX = "[Ihsan OS]";
// ─── SkillRegistry ──────────────────────────────────────────────────
class SkillRegistry {
    skills = new Map();
    /**
     * Scan /skills directory for .ts files, import each one,
     * validate against the Skill interface, and register valid ones.
     *
     * - Ignores subdirectories (e.g. skills/slides/)
     * - Ignores non-.ts files
     * - Skips + warns on malformed exports
     * - All loaded skills default to enabled = true
     */
    async loadSkills() {
        this.skills.clear();
        let entries;
        try {
            const dirContents = await (0, promises_1.readdir)(SKILLS_DIR, { withFileTypes: true });
            // Only grab .ts files at the top level — ignore subdirectories
            entries = dirContents
                .filter((entry) => entry.isFile() && (0, node_path_1.extname)(entry.name) === ".ts")
                .map((entry) => entry.name);
        }
        catch (err) {
            console.warn(`${LOG_PREFIX} Could not read skills directory: ${SKILLS_DIR}`);
            return;
        }
        if (entries.length === 0) {
            console.log(`${LOG_PREFIX} No .ts skill files found in /skills`);
            return;
        }
        const now = new Date().toISOString();
        for (const filename of entries) {
            const filepath = (0, node_path_1.join)(SKILLS_DIR, filename);
            try {
                // Dynamic import — tsx runtime handles .ts files natively
                const mod = await Promise.resolve(`${filepath}`).then(s => __importStar(require(s)));
                const skillObj = mod.default ?? mod;
                if ((0, skill_interface_1.isValidSkill)(skillObj)) {
                    this.skills.set(skillObj.name, {
                        skill: skillObj,
                        enabled: true,
                        loadedAt: now,
                    });
                    console.log(`${LOG_PREFIX} Loaded skill: ${skillObj.name}`);
                }
                else {
                    console.warn(`${LOG_PREFIX} Skipped ${filename} — does not export a valid Skill object`);
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.warn(`${LOG_PREFIX} Failed to import ${filename}: ${message}`);
            }
        }
        console.log(`${LOG_PREFIX} Skill registry ready — ${this.skills.size} skill(s) loaded`);
    }
    // ── Lookups ───────────────────────────────────────────────────────
    /**
     * Get a single skill by name.
     */
    getSkill(name) {
        return this.skills.get(name)?.skill;
    }
    /**
     * Return all registered skills as an array (regardless of enabled state).
     */
    getAllSkills() {
        return Array.from(this.skills.values()).map((r) => r.skill);
    }
    /**
     * Return only enabled skills.
     */
    getEnabledSkills() {
        return Array.from(this.skills.values())
            .filter((r) => r.enabled)
            .map((r) => r.skill);
    }
    /**
     * Check if a skill is enabled.
     */
    isEnabled(name) {
        return this.skills.get(name)?.enabled ?? false;
    }
    // ── Mutations ─────────────────────────────────────────────────────
    /**
     * Toggle a skill's enabled state. Returns the new state,
     * or undefined if the skill doesn't exist.
     */
    toggleSkill(name) {
        const record = this.skills.get(name);
        if (!record)
            return undefined;
        record.enabled = !record.enabled;
        console.log(`${LOG_PREFIX} Skill "${name}" ${record.enabled ? "enabled" : "disabled"}`);
        return { name, enabled: record.enabled };
    }
    // ── Tool Definitions (for Vercel AI SDK) ──────────────────────────
    /**
     * Convert ENABLED skills into Vercel AI SDK tool() definitions.
     * These can be spread directly into the streamText({ tools }) call.
     *
     * Only enabled skills are included — disabled skills are invisible
     * to the LLM.
     */
    getToolDefinitions() {
        const tools = {};
        for (const [name, record] of this.skills) {
            if (!record.enabled)
                continue;
            tools[name] = (0, ai_1.tool)({
                description: record.skill.description,
                inputSchema: record.skill.parameters,
                execute: async (params) => {
                    try {
                        return await record.skill.execute(params);
                    }
                    catch (err) {
                        const message = err instanceof Error ? err.message : String(err);
                        console.error(`${LOG_PREFIX} Skill "${name}" execution error: ${message}`);
                        return { error: `Skill "${name}" failed: ${message}` };
                    }
                },
            });
        }
        return tools;
    }
    // ── System Prompt Context ─────────────────────────────────────────
    /**
     * Build a text block describing available (enabled) dynamic skills
     * for injection into the agent's system prompt.
     */
    getSkillsPromptContext() {
        const enabled = this.getEnabledSkills();
        if (enabled.length === 0)
            return "";
        const lines = [];
        lines.push("[DYNAMIC SKILLS — Hot-loaded from /skills]");
        lines.push("The following tools were loaded dynamically. Use them when relevant.\n");
        for (const skill of enabled) {
            lines.push(`- **${skill.name}**: ${skill.description}`);
        }
        return lines.join("\n");
    }
    // ── API Serialization ─────────────────────────────────────────────
    /**
     * Serialize all dynamic skills to a JSON-safe format for the API.
     * The frontend expects: { id, title, desc, enabled, official, date, tools }
     */
    toApiResponse() {
        const result = [];
        for (const [name, record] of this.skills) {
            result.push({
                id: name,
                title: name,
                desc: record.skill.description,
                enabled: record.enabled,
                official: false, // dynamic skills are community/user-created
                date: record.loadedAt.split("T")[0].replace(/-/g, "/"),
                tools: [name], // the skill IS the tool
                type: "dynamic",
            });
        }
        return result;
    }
}
exports.SkillRegistry = SkillRegistry;
