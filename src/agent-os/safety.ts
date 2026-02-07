/**
 * safety.ts — The Self-Preservation Layer (Phase 9: Kernel Separation)
 *
 * Enforces the Kernel vs. Workspace architecture:
 *
 *   KERNEL (Read-Only):
 *     src/, server/, config/, public/, node_modules/, .git/, .next/
 *     package.json, tsconfig.json, .env.local, etc.
 *     → The agent can READ these to learn, but NEVER write to them.
 *
 *   WORKSPACE (Read-Write):
 *     workspace/  → Primary. All user projects go here.
 *     skills/     → Evolutionary. Agent can create new skills.
 *     inputs/     → Data IO. User uploads.
 *     outputs/    → Data IO. Generated artifacts.
 *     memory/     → Agent memory. Facts and conversation history.
 *
 *   READ BLOCKED:
 *     .env.local, .env.example → Secrets. Never exposed to agent output.
 */

import { normalize, isAbsolute } from "node:path";

// ─── Kernel: paths the agent must never WRITE to ────────────────

const PROTECTED_PATHS: readonly string[] = [
  "src/agent-os",
  "src/app",
  "src/components",
  "src/hooks",
  "src/lib",
  "src/",
  "server",
  "config",
  "node_modules",
  ".git",
  ".next",
  "public",
  "browser-extension",
] as const;

const PROTECTED_FILES: readonly string[] = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  ".env.local",
  ".env.example",
  ".gitignore",
] as const;

// ─── Workspace: the only places the agent may WRITE ─────────────

const ALLOWED_WRITE_PREFIXES: readonly string[] = [
  "workspace/",  // Primary — all user projects
  "skills/",     // Evolutionary — new dynamic skills
  "inputs/",     // Data IO — uploads
  "outputs/",    // Data IO — artifacts
  "memory/",     // Agent memory
] as const;

// ─── Secrets: paths the agent must never READ ───────────────────

const READ_BLOCKED_FILES: readonly string[] = [
  ".env.local",
  ".env.example",
  ".env",
] as const;

// ─── Shared normalization ───────────────────────────────────────

function normalizePath(filepath: string): string {
  return normalize(filepath).replace(/\\/g, "/");
}

function isEscaping(normalized: string): boolean {
  return (
    isAbsolute(normalized) ||
    normalized.startsWith("..") ||
    normalized.includes("/../")
  );
}

// ─── WRITE Safety Check ────────────────────────────────────────

/**
 * Determines whether a given filepath is safe for the agent to WRITE to.
 *
 * Rules:
 *   1. Reject absolute paths and path traversal
 *   2. Reject any path targeting a protected directory or file (Kernel)
 *   3. Accept ONLY paths inside an allowed write prefix (Workspace)
 *   4. Default deny
 */
export function isSafePath(filepath: string): boolean {
  const normalized = normalizePath(filepath);

  // 1. Reject escape attempts
  if (isEscaping(normalized)) return false;

  // 2. Check against protected files (exact match on basename or full path)
  const filename = normalized.split("/").pop() || "";
  for (const protectedFile of PROTECTED_FILES) {
    if (normalized === protectedFile || filename === protectedFile) {
      return false;
    }
  }

  // 3. Check against protected directories (prefix match)
  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/") ||
      normalized.startsWith(protectedPath)
    ) {
      return false;
    }
  }

  // 4. Must be inside an allowed write zone
  for (const prefix of ALLOWED_WRITE_PREFIXES) {
    if (normalized.startsWith(prefix)) return true;
  }

  // Default deny
  return false;
}

// ─── READ Safety Check ─────────────────────────────────────────

/**
 * Determines whether a given filepath is safe for the agent to READ.
 *
 * The agent can read almost everything (self-awareness), EXCEPT:
 *   - .env files (secrets)
 *   - Paths that escape the project root
 */
export function isSafeReadPath(filepath: string): boolean {
  const normalized = normalizePath(filepath);

  // Reject escape attempts
  if (isEscaping(normalized)) return false;

  // Block secret files
  const filename = normalized.split("/").pop() || "";
  for (const blocked of READ_BLOCKED_FILES) {
    if (normalized === blocked || filename === blocked) {
      return false;
    }
  }

  // Everything else is readable
  return true;
}

// ─── Human-Readable Error Messages ──────────────────────────────

/**
 * Returns a human-readable explanation of why a WRITE was blocked.
 */
export function explainBlock(filepath: string): string {
  const normalized = normalizePath(filepath);

  if (isAbsolute(normalized)) {
    return "Absolute paths are not allowed. Use a relative path from the project root.";
  }

  if (normalized.startsWith("..")) {
    return "Path traversal (..) is not allowed. Stay within the project.";
  }

  for (const protectedFile of PROTECTED_FILES) {
    if (normalized === protectedFile) {
      return `"${protectedFile}" is a Kernel file and cannot be modified. The Kernel is read-only.`;
    }
  }

  for (const protectedPath of PROTECTED_PATHS) {
    if (normalized.startsWith(protectedPath)) {
      return `The "${protectedPath}" directory is part of the Kernel and is read-only. Write to workspace/ instead.`;
    }
  }

  return `The path "${normalized}" is outside the Workspace. Write to workspace/, skills/, inputs/, outputs/, or memory/.`;
}
