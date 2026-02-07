/**
 * fs-adapter.ts — AgentOS File System Adapter
 *
 * The physical interface between the IhsanAgent and the disk.
 * All reads/writes go through here. No in-memory caching.
 * Every call hits the real filesystem via fs/promises.
 */

import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ─── Paths ──────────────────────────────────────────────────────────

const ROOT = process.cwd();
const CONFIG_DIR = join(ROOT, "config");
const MEMORY_DIR = join(ROOT, "memory");
const SKILLS_DIR = join(ROOT, "skills");
const INPUTS_DIR = join(ROOT, "inputs");
const OUTPUTS_DIR = join(ROOT, "outputs");
const WORKSPACE_DIR = join(ROOT, "workspace");
const PERSONA_DIR = join(ROOT, "src", "lib", "agent-persona");

// ─── Bootstrap ──────────────────────────────────────────────────────

/** Ensure all AgentOS directories exist on disk. Call once at startup. */
export async function ensureDirs(): Promise<void> {
  for (const dir of [CONFIG_DIR, MEMORY_DIR, SKILLS_DIR, INPUTS_DIR, OUTPUTS_DIR, WORKSPACE_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

/** Ensure the /inputs upload directory exists. Returns the absolute path. */
export async function ensureUploadsDir(): Promise<string> {
  if (!existsSync(INPUTS_DIR)) {
    await mkdir(INPUTS_DIR, { recursive: true });
  }
  return INPUTS_DIR;
}

/** Get the absolute path to the /inputs directory */
export function getInputsDir(): string {
  return INPUTS_DIR;
}

// ─── Config (/config) ───────────────────────────────────────────────

/** Read a config file from /config (e.g. "soul.md", "identity.md", "settings.json") */
export async function readConfig(filename: string): Promise<string> {
  const filepath = join(CONFIG_DIR, filename);
  try {
    return await readFile(filepath, "utf-8");
  } catch {
    return "";
  }
}

/** Write a config file to /config */
export async function writeConfig(filename: string, data: string): Promise<void> {
  const filepath = join(CONFIG_DIR, filename);
  await writeFile(filepath, data, "utf-8");
}

// ─── Memory (/memory) ──────────────────────────────────────────────

/** Read a memory file from /memory (e.g. "user.md", "short_term.json") */
export async function readMemory(filename: string): Promise<string> {
  const filepath = join(MEMORY_DIR, filename);
  try {
    return await readFile(filepath, "utf-8");
  } catch {
    return "";
  }
}

/** Append a log entry to a memory file on disk */
export async function appendMemory(filename: string, log: string): Promise<void> {
  const filepath = join(MEMORY_DIR, filename);

  if (filename.endsWith(".json")) {
    // For JSON files: read → parse → push → write
    let entries: unknown[] = [];
    try {
      const raw = await readFile(filepath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) entries = parsed;
    } catch {
      // File missing or invalid — start fresh
    }
    entries.push(JSON.parse(log));
    await writeFile(filepath, JSON.stringify(entries, null, 2) + "\n", "utf-8");
  } else {
    // For text files: simple append
    await appendFile(filepath, log + "\n", "utf-8");
  }
}

// ─── Persona (operational instructions) ────────────────────────────

/** List of operational persona files (not identity/soul — those are in /config) */
const OPERATIONAL_FILES = [
  "AGENTS.md",
  "MEMORY.md",
  "HEARTBEAT.md",
  "TOOLS.md",
  "USER.md",
] as const;

/** Load operational persona files from src/lib/agent-persona/ */
export async function loadOperationalPersona(): Promise<string> {
  const sections: string[] = [];
  for (const file of OPERATIONAL_FILES) {
    try {
      const content = await readFile(join(PERSONA_DIR, file), "utf-8");
      if (content.trim()) sections.push(content.trim());
    } catch {
      // File missing — skip
    }
  }
  return sections.join("\n\n---\n\n");
}
