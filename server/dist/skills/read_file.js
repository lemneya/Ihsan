"use strict";
/**
 * read_file.ts — The Vision Skill
 *
 * Reads uploaded files from the /inputs directory.
 * Automatically detected by the SkillRegistry on server startup.
 *
 * Supported formats: .txt, .md, .json, .ts, .js, .csv, .html, .xml, .yaml, .yml
 *
 * Security: filename is sanitized to prevent directory traversal.
 * The skill ONLY reads from /inputs — it cannot escape that directory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
// ─── Constants ──────────────────────────────────────────────────────
const INPUTS_DIR = (0, node_path_1.join)(process.cwd(), "inputs");
const SUPPORTED_EXTENSIONS = new Set([
    ".txt",
    ".md",
    ".json",
    ".ts",
    ".js",
    ".csv",
    ".html",
    ".xml",
    ".yaml",
    ".yml",
]);
// ─── Skill Definition ───────────────────────────────────────────────
const readFileSkill = {
    name: "read_file",
    description: "Read the contents of a file from the /inputs directory. Use this when the user asks you to analyze, summarize, or read an uploaded file. Supports .txt, .md, .json, .ts, .js, .csv, .html, .xml, .yaml, .yml files.",
    parameters: zod_1.z.object({
        filename: zod_1.z
            .string()
            .describe("The name of the file to read (e.g. 'budget.txt', 'data.json'). Must be a file in the /inputs directory."),
    }),
    execute: async ({ filename }) => {
        // ── Security: sanitize filename ─────────────────────────────────
        // Strip any path components — only the base filename is allowed.
        // This prevents directory traversal attacks like "../../etc/passwd".
        const safe = (0, node_path_1.basename)(filename);
        if (safe !== filename || safe.includes("..") || safe.startsWith(".")) {
            return {
                error: `Invalid filename: "${filename}". Only simple filenames are allowed (no paths, no dotfiles).`,
            };
        }
        // ── Check extension ─────────────────────────────────────────────
        const ext = (0, node_path_1.extname)(safe).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
            return {
                error: `Unsupported file type: "${ext}". Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
            };
        }
        // ── Read file ───────────────────────────────────────────────────
        const filepath = (0, node_path_1.join)(INPUTS_DIR, safe);
        try {
            const content = await (0, promises_1.readFile)(filepath, "utf-8");
            // Truncate very large files to prevent context overflow
            const MAX_LENGTH = 50_000;
            const truncated = content.length > MAX_LENGTH;
            const output = truncated
                ? content.slice(0, MAX_LENGTH) + "\n\n[... truncated at 50,000 characters]"
                : content;
            return {
                filename: safe,
                extension: ext,
                size: content.length,
                truncated,
                content: output,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.includes("ENOENT")) {
                return {
                    error: `File not found: "${safe}". Make sure the file was uploaded first.`,
                };
            }
            return { error: `Failed to read file: ${message}` };
        }
    },
};
exports.default = readFileSkill;
