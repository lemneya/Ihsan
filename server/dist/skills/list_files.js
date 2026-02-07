"use strict";
/**
 * list_files.ts — The Mirror Skill
 *
 * Gives Ihsan self-awareness of his own file structure.
 * Without this, the agent creates duplicate files because it
 * can't see what already exists.
 *
 * Supports recursive tree walking with depth limits.
 * Automatically skips node_modules, .git, and .next for performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
// ─── Constants ──────────────────────────────────────────────────
const ROOT = process.cwd();
/** Directories to always skip — scanning these would be slow and useless */
const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    ".turbo",
    ".vercel",
    "dist",
    ".cache",
]);
/**
 * Recursively walk a directory and build a tree of entries.
 * Respects depth limits and skips blacklisted directories.
 */
async function walkDir(dirPath, currentDepth, maxDepth) {
    const entries = [];
    let dirContents;
    try {
        dirContents = await (0, promises_1.readdir)(dirPath, { withFileTypes: true });
    }
    catch {
        return entries; // Permission denied or missing — skip silently
    }
    // Sort: directories first, then files, alphabetical within each group
    const sorted = dirContents.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory())
            return -1;
        if (!a.isDirectory() && b.isDirectory())
            return 1;
        return a.name.localeCompare(b.name);
    });
    for (const entry of sorted) {
        const fullPath = (0, node_path_1.join)(dirPath, entry.name);
        const relativePath = (0, node_path_1.relative)(ROOT, fullPath).replace(/\\/g, "/");
        if (entry.isDirectory()) {
            // Skip blacklisted directories
            if (SKIP_DIRS.has(entry.name))
                continue;
            const node = {
                name: entry.name,
                path: relativePath,
                type: "dir",
            };
            // Recurse if within depth limit
            if (currentDepth < maxDepth) {
                node.children = await walkDir(fullPath, currentDepth + 1, maxDepth);
            }
            entries.push(node);
        }
        else {
            entries.push({
                name: entry.name,
                path: relativePath,
                type: "file",
            });
        }
    }
    return entries;
}
/**
 * Format a tree into a visual ASCII tree string.
 *
 * Example output:
 *   ├── src/
 *   │   ├── agent-os/
 *   │   │   ├── agent.ts
 *   │   │   ├── safety.ts
 *   │   │   └── types/
 *   │   │       └── skill.interface.ts
 *   └── skills/
 *       ├── browser_search.ts
 *       └── write_file.ts
 */
function formatTree(entries, prefix = "") {
    const lines = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const childPrefix = isLast ? "    " : "│   ";
        const suffix = entry.type === "dir" ? "/" : "";
        lines.push(`${prefix}${connector}${entry.name}${suffix}`);
        if (entry.children && entry.children.length > 0) {
            lines.push(formatTree(entry.children, prefix + childPrefix));
        }
    }
    return lines.join("\n");
}
// ─── Skill Definition ───────────────────────────────────────────
const listFiles = {
    name: "list_files",
    description: "List files and directories. Use this to explore the codebase, map the project " +
        "structure, or find specific files before creating new ones. Supports recursive " +
        "listing with depth control. Use this BEFORE writing files to avoid duplicates.",
    parameters: zod_1.z.object({
        dir_path: zod_1.z
            .string()
            .default(".")
            .describe("Relative path from project root (e.g. '.', 'src', 'skills', 'src/agent-os')"),
        recursive: zod_1.z
            .boolean()
            .default(false)
            .describe("If true, list all files recursively in subdirectories"),
        depth: zod_1.z
            .number()
            .min(1)
            .max(10)
            .default(3)
            .describe("Maximum depth for recursive listing (1-10, default 3)"),
    }),
    execute: async (params) => {
        const { dir_path = ".", recursive = false, depth = 3 } = params;
        // ── Safety: prevent escaping the project root ────────────
        const normalized = (0, node_path_1.normalize)(dir_path).replace(/\\/g, "/");
        if ((0, node_path_1.isAbsolute)(normalized)) {
            throw new Error("ACCESS DENIED: Absolute paths are not allowed. Use a relative path from the project root.");
        }
        if (normalized.startsWith("..")) {
            throw new Error("ACCESS DENIED: Path traversal (..) is not allowed. Stay within the project.");
        }
        const targetDir = (0, node_path_1.join)(ROOT, normalized);
        // Verify the resolved path is still within the project
        const resolvedRelative = (0, node_path_1.relative)(ROOT, targetDir);
        if (resolvedRelative.startsWith("..")) {
            throw new Error("ACCESS DENIED: The resolved path escapes the project root.");
        }
        // Verify the target exists and is a directory
        try {
            const stats = await (0, promises_1.stat)(targetDir);
            if (!stats.isDirectory()) {
                throw new Error(`"${dir_path}" is a file, not a directory.`);
            }
        }
        catch (err) {
            if (err.code === "ENOENT") {
                throw new Error(`Directory not found: "${dir_path}"`);
            }
            throw err;
        }
        // ── Walk the tree ────────────────────────────────────────
        const maxDepth = recursive ? depth : 1;
        const tree = await walkDir(targetDir, 0, maxDepth);
        // ── Format output ────────────────────────────────────────
        const header = normalized === "." ? "/" : `/${normalized}/`;
        const treeString = formatTree(tree);
        // Count totals
        let fileCount = 0;
        let dirCount = 0;
        function countEntries(entries) {
            for (const e of entries) {
                if (e.type === "file")
                    fileCount++;
                else
                    dirCount++;
                if (e.children)
                    countEntries(e.children);
            }
        }
        countEntries(tree);
        return {
            root: header,
            tree: treeString,
            summary: `${dirCount} directories, ${fileCount} files`,
            entries: tree, // structured data for programmatic use
        };
    },
};
exports.default = listFiles;
