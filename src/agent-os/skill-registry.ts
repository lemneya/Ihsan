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

import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { tool } from "ai";
import { Skill, isValidSkill } from "./types/skill.interface";

// ─── Constants ──────────────────────────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills");
const LOG_PREFIX = "[Ihsan OS]";

// ─── Internal Types ─────────────────────────────────────────────────

/** Internal record: the Skill object + its runtime state */
interface SkillRecord {
  skill: Skill;
  enabled: boolean;
  loadedAt: string; // ISO timestamp
}

/** JSON-safe representation returned by the API */
export interface SkillApiEntry {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
  official: boolean;
  date: string;
  tools: string[];
  type: "dynamic"; // distinguishes from hardcoded skills
}

// ─── SkillRegistry ──────────────────────────────────────────────────

export class SkillRegistry {
  private skills = new Map<string, SkillRecord>();

  /**
   * Scan /skills directory for .ts files, import each one,
   * validate against the Skill interface, and register valid ones.
   *
   * - Ignores subdirectories (e.g. skills/slides/)
   * - Ignores non-.ts files
   * - Skips + warns on malformed exports
   * - All loaded skills default to enabled = true
   */
  async loadSkills(): Promise<void> {
    this.skills.clear();

    let entries: string[];
    try {
      const dirContents = await readdir(SKILLS_DIR, { withFileTypes: true });
      // Only grab .ts files at the top level — ignore subdirectories
      entries = dirContents
        .filter((entry) => entry.isFile() && extname(entry.name) === ".ts")
        .map((entry) => entry.name);
    } catch (err) {
      console.warn(`${LOG_PREFIX} Could not read skills directory: ${SKILLS_DIR}`);
      return;
    }

    if (entries.length === 0) {
      console.log(`${LOG_PREFIX} No .ts skill files found in /skills`);
      return;
    }

    const now = new Date().toISOString();

    for (const filename of entries) {
      const filepath = join(SKILLS_DIR, filename);
      try {
        // Dynamic import — tsx runtime handles .ts files natively
        const mod = await import(filepath);
        const skillObj = mod.default ?? mod;

        if (isValidSkill(skillObj)) {
          this.skills.set(skillObj.name, {
            skill: skillObj,
            enabled: true,
            loadedAt: now,
          });
          console.log(`${LOG_PREFIX} Loaded skill: ${skillObj.name}`);
        } else {
          console.warn(
            `${LOG_PREFIX} Skipped ${filename} — does not export a valid Skill object`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`${LOG_PREFIX} Failed to import ${filename}: ${message}`);
      }
    }

    console.log(
      `${LOG_PREFIX} Skill registry ready — ${this.skills.size} skill(s) loaded`
    );
  }

  // ── Lookups ───────────────────────────────────────────────────────

  /**
   * Get a single skill by name.
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name)?.skill;
  }

  /**
   * Return all registered skills as an array (regardless of enabled state).
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values()).map((r) => r.skill);
  }

  /**
   * Return only enabled skills.
   */
  getEnabledSkills(): Skill[] {
    return Array.from(this.skills.values())
      .filter((r) => r.enabled)
      .map((r) => r.skill);
  }

  /**
   * Check if a skill is enabled.
   */
  isEnabled(name: string): boolean {
    return this.skills.get(name)?.enabled ?? false;
  }

  // ── Mutations ─────────────────────────────────────────────────────

  /**
   * Toggle a skill's enabled state. Returns the new state,
   * or undefined if the skill doesn't exist.
   */
  toggleSkill(name: string): { name: string; enabled: boolean } | undefined {
    const record = this.skills.get(name);
    if (!record) return undefined;

    record.enabled = !record.enabled;
    console.log(
      `${LOG_PREFIX} Skill "${name}" ${record.enabled ? "enabled" : "disabled"}`
    );
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
  getToolDefinitions(): Record<string, unknown> {
    const tools: Record<string, unknown> = {};

    for (const [name, record] of this.skills) {
      if (!record.enabled) continue;

      tools[name] = tool({
        description: record.skill.description,
        inputSchema: record.skill.parameters,
        execute: async (params: any) => {
          try {
            return await record.skill.execute(params);
          } catch (err) {
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
  getSkillsPromptContext(): string {
    const enabled = this.getEnabledSkills();
    if (enabled.length === 0) return "";

    const lines: string[] = [];
    lines.push("[DYNAMIC SKILLS — Hot-loaded from /skills]");
    lines.push(
      "The following tools were loaded dynamically. Use them when relevant.\n"
    );

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
  toApiResponse(): SkillApiEntry[] {
    const result: SkillApiEntry[] = [];

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
