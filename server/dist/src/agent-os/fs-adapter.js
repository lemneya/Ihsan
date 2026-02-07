"use strict";
/**
 * fs-adapter.ts — AgentOS File System Adapter
 *
 * The physical interface between the IhsanAgent and the disk.
 * All reads/writes go through here. No in-memory caching.
 * Every call hits the real filesystem via fs/promises.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirs = ensureDirs;
exports.ensureUploadsDir = ensureUploadsDir;
exports.getInputsDir = getInputsDir;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.readMemory = readMemory;
exports.appendMemory = appendMemory;
exports.loadOperationalPersona = loadOperationalPersona;
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
// ─── Paths ──────────────────────────────────────────────────────────
const ROOT = process.cwd();
const CONFIG_DIR = (0, node_path_1.join)(ROOT, "config");
const MEMORY_DIR = (0, node_path_1.join)(ROOT, "memory");
const SKILLS_DIR = (0, node_path_1.join)(ROOT, "skills");
const INPUTS_DIR = (0, node_path_1.join)(ROOT, "inputs");
const OUTPUTS_DIR = (0, node_path_1.join)(ROOT, "outputs");
const WORKSPACE_DIR = (0, node_path_1.join)(ROOT, "workspace");
const PERSONA_DIR = (0, node_path_1.join)(ROOT, "src", "lib", "agent-persona");
// ─── Bootstrap ──────────────────────────────────────────────────────
/** Ensure all AgentOS directories exist on disk. Call once at startup. */
async function ensureDirs() {
    for (const dir of [CONFIG_DIR, MEMORY_DIR, SKILLS_DIR, INPUTS_DIR, OUTPUTS_DIR, WORKSPACE_DIR]) {
        if (!(0, node_fs_1.existsSync)(dir)) {
            await (0, promises_1.mkdir)(dir, { recursive: true });
        }
    }
}
/** Ensure the /inputs upload directory exists. Returns the absolute path. */
async function ensureUploadsDir() {
    if (!(0, node_fs_1.existsSync)(INPUTS_DIR)) {
        await (0, promises_1.mkdir)(INPUTS_DIR, { recursive: true });
    }
    return INPUTS_DIR;
}
/** Get the absolute path to the /inputs directory */
function getInputsDir() {
    return INPUTS_DIR;
}
// ─── Config (/config) ───────────────────────────────────────────────
/** Read a config file from /config (e.g. "soul.md", "identity.md", "settings.json") */
async function readConfig(filename) {
    const filepath = (0, node_path_1.join)(CONFIG_DIR, filename);
    try {
        return await (0, promises_1.readFile)(filepath, "utf-8");
    }
    catch {
        return "";
    }
}
/** Write a config file to /config */
async function writeConfig(filename, data) {
    const filepath = (0, node_path_1.join)(CONFIG_DIR, filename);
    await (0, promises_1.writeFile)(filepath, data, "utf-8");
}
// ─── Memory (/memory) ──────────────────────────────────────────────
/** Read a memory file from /memory (e.g. "user.md", "short_term.json") */
async function readMemory(filename) {
    const filepath = (0, node_path_1.join)(MEMORY_DIR, filename);
    try {
        return await (0, promises_1.readFile)(filepath, "utf-8");
    }
    catch {
        return "";
    }
}
/** Append a log entry to a memory file on disk */
async function appendMemory(filename, log) {
    const filepath = (0, node_path_1.join)(MEMORY_DIR, filename);
    if (filename.endsWith(".json")) {
        // For JSON files: read → parse → push → write
        let entries = [];
        try {
            const raw = await (0, promises_1.readFile)(filepath, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed))
                entries = parsed;
        }
        catch {
            // File missing or invalid — start fresh
        }
        entries.push(JSON.parse(log));
        await (0, promises_1.writeFile)(filepath, JSON.stringify(entries, null, 2) + "\n", "utf-8");
    }
    else {
        // For text files: simple append
        await (0, promises_1.appendFile)(filepath, log + "\n", "utf-8");
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
];
/** Load operational persona files from src/lib/agent-persona/ */
async function loadOperationalPersona() {
    const sections = [];
    for (const file of OPERATIONAL_FILES) {
        try {
            const content = await (0, promises_1.readFile)((0, node_path_1.join)(PERSONA_DIR, file), "utf-8");
            if (content.trim())
                sections.push(content.trim());
        }
        catch {
            // File missing — skip
        }
    }
    return sections.join("\n\n---\n\n");
}
