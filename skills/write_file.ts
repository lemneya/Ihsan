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

import { z } from "zod";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { Skill } from "../src/agent-os/types/skill.interface";
import { isSafePath, explainBlock } from "../src/agent-os/safety";

/**
 * If the filepath has no directory prefix, prepend workspace/.
 * e.g. "script.py" → "workspace/script.py"
 *      "hello/app.js" → "workspace/hello/app.js"
 *      "skills/my_skill.ts" → "skills/my_skill.ts" (already prefixed)
 */
function resolveDefaultPath(filepath: string): string {
  const known = ["workspace/", "skills/", "inputs/", "outputs/", "memory/"];
  for (const prefix of known) {
    if (filepath.startsWith(prefix)) return filepath;
  }
  // No known prefix — default to workspace/
  return `workspace/${filepath}`;
}

const writeFileSkill: Skill = {
  name: "write_file",

  description:
    "Write content to a file. Defaults to the `workspace/` directory. " +
    "**USE THIS TOOL** whenever the user asks you to create code, write a script, " +
    "build a project, save data, or generate any file. Do not ask for permission. " +
    "Just write it. You CANNOT write to the system Kernel (`src/`, `server/`, `config/`). " +
    "A built-in safety layer enforces this automatically.",

  parameters: z.object({
    filepath: z
      .string()
      .describe(
        "File path relative to project root. If no directory prefix is given, " +
        "defaults to workspace/ (e.g. 'script.py' → 'workspace/script.py'). " +
        "Use 'skills/name.ts' for new skills, 'outputs/name.ext' for artifacts."
      ),
    content: z.string().describe("The full content to write to the file"),
  }),

  execute: async (params: { filepath: string; content: string }) => {
    const { content } = params;
    let { filepath } = params;

    // ── Auto-prefix: bare filenames go to workspace/ ──────────
    filepath = resolveDefaultPath(filepath);

    // ── CRITICAL: Kernel Protection Check ─────────────────────
    if (!isSafePath(filepath)) {
      const reason = explainBlock(filepath);
      throw new Error(
        `ACCESS DENIED: Kernel Protection active. ${reason}`
      );
    }

    // Resolve to absolute path within the project
    const absolutePath = join(process.cwd(), filepath);

    // Ensure the parent directory exists
    const parentDir = dirname(absolutePath);
    await mkdir(parentDir, { recursive: true });

    // Write the file
    await writeFile(absolutePath, content, "utf-8");

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

export default writeFileSkill;
