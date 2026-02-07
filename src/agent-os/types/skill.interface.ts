/**
 * skill.interface.ts — The DNA of every Ihsan Skill
 *
 * Every .ts file dropped into /skills must default-export
 * an object that satisfies this interface.
 *
 * The SkillRegistry validates each import against this shape
 * before registering it as an available tool.
 */

import { z } from "zod";

export interface Skill {
  /** Unique machine name — becomes the tool name in the LLM call (e.g. "browser_search") */
  name: string;

  /** Human-readable description — shown to the LLM so it knows when to use this tool */
  description: string;

  /** Zod schema defining the input parameters the LLM must provide */
  parameters: z.ZodSchema;

  /** The function that runs when the LLM selects this tool */
  execute: (params: any, context?: any) => Promise<any>;
}

/**
 * Type guard: validates that an unknown import is a valid Skill object.
 * Used by SkillRegistry to safely filter malformed skill files.
 */
export function isValidSkill(obj: unknown): obj is Skill {
  if (obj === null || typeof obj !== "object") return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    typeof candidate.description === "string" &&
    candidate.description.length > 0 &&
    candidate.parameters instanceof z.ZodType &&
    typeof candidate.execute === "function"
  );
}
