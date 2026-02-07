"use strict";
/**
 * write_file.ts — The Engineer Skill (Phase 9: Kernel Separation)
 *
 * Gives Ihsan the ability to create files on disk.
 * Defaults to workspace/ for all user projects.
 *
 * KERNEL LAW:
 *   - workspace/  → Primary. All user code goes here.
 *   - skills/     → New dynamic skills (.ts files).
 *   - inputs/     → User uploads.
 *   - outputs/    → Generated artifacts.
 *   - memory/     → Agent memory.
 *   - Everything else → BLOCKED by safety.ts.
 *
 * If the user provides a bare filename (no path prefix),
 * it is automatically placed in workspace/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const safety_1 = require("../src/agent-os/safety");
/**
 * If the filepath has no directory prefix, prepend workspace/.
 * e.g. "script.py" → "workspace/script.py"
 *      "hello/app.js" → "workspace/hello/app.js"
 *      "skills/my_skill.ts" → "skills/my_skill.ts" (already prefixed)
 */
function resolveDefaultPath(filepath) {
    const known = ["workspace/", "skills/", "inputs/", "outputs/", "memory/"];
    for (const prefix of known) {
        if (filepath.startsWith(prefix))
            return filepath;
    }
    // No known prefix — default to workspace/
    return `workspace/${filepath}`;
}
const writeFileSkill = {
    name: "write_file",
    description: "Write content to a file. Defaults to the `workspace/` directory. " +
        "**USE THIS TOOL** whenever the user asks you to create code, write a script, " +
        "build a project, save data, or generate any file. Do not ask for permission. " +
        "Just write it. You CANNOT write to the system Kernel (`src/`, `server/`, `config/`). " +
        "A built-in safety layer enforces this automatically.",
    parameters: zod_1.z.object({
        filepath: zod_1.z
            .string()
            .describe("File path relative to project root. If no directory prefix is given, " +
            "defaults to workspace/ (e.g. 'script.py' → 'workspace/script.py'). " +
            "Use 'skills/name.ts' for new skills, 'outputs/name.ext' for artifacts."),
        content: zod_1.z.string().describe("The full content to write to the file"),
    }),
    execute: async (params) => {
        const { content } = params;
        let { filepath } = params;
        // ── Auto-prefix: bare filenames go to workspace/ ──────────
        filepath = resolveDefaultPath(filepath);
        // ── CRITICAL: Kernel Protection Check ─────────────────────
        if (!(0, safety_1.isSafePath)(filepath)) {
            const reason = (0, safety_1.explainBlock)(filepath);
            throw new Error(`ACCESS DENIED: Kernel Protection active. ${reason}`);
        }
        // Resolve to absolute path within the project
        const absolutePath = (0, node_path_1.join)(process.cwd(), filepath);
        // Ensure the parent directory exists
        const parentDir = (0, node_path_1.dirname)(absolutePath);
        await (0, promises_1.mkdir)(parentDir, { recursive: true });
        // Write the file
        await (0, promises_1.writeFile)(absolutePath, content, "utf-8");
        // Compute metadata
        const lines = content.split("\n").length;
        const bytes = Buffer.byteLength(content, "utf-8");
        return {
            success: true,
            filepath,
            lines,
            bytes,
            message: `File written successfully: ${filepath} (${lines} lines, ${bytes} bytes)`,
        };
    },
};
exports.default = writeFileSkill;
