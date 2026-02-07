/**
 * memorize.ts — The Learning Skill
 *
 * Gives Ihsan the ability to explicitly remember things about the user.
 * When the LLM decides something is worth remembering (name, preferences,
 * project details, etc.), it calls this tool to persist it to disk.
 *
 * Facts are stored in memory/user.md as markdown bullets.
 * They survive server restarts and are injected into every future prompt.
 *
 * Implements the Skill interface from src/agent-os/types/skill.interface.ts
 */

import { z } from "zod";
import type { Skill } from "../src/agent-os/types/skill.interface";
import { MemoryManager } from "../src/agent-os/memory-manager";

const memory = new MemoryManager();

const memorize: Skill = {
  name: "memorize",

  description:
    "Save an important fact about the user to long-term memory. Use this when the user " +
    "shares personal information (name, preferences, project details, goals) that should " +
    "be remembered across sessions. Facts persist on disk and survive server restarts. " +
    "Do NOT memorize trivial or temporary information — only things that will be useful " +
    "in future conversations.",

  parameters: z.object({
    fact: z
      .string()
      .min(3)
      .describe(
        "The fact to remember, written as a clear statement. " +
        'Example: "User\'s name is Alex" or "User prefers dark mode" or ' +
        '"User is building a SaaS app called Nexus"'
      ),
    category: z
      .enum(["identity", "preference", "project", "context", "other"])
      .default("other")
      .describe("Category of the fact for organization"),
  }),

  execute: async (params: { fact: string; category?: string }) => {
    const { fact, category = "other" } = params;

    // Prefix with category for organized storage
    const categorizedFact = `[${category}] ${fact}`;

    await memory.updateUserFact(categorizedFact);

    return {
      success: true,
      message: `Memorized: "${fact}"`,
      category,
      persisted: true,
    };
  },
};

export default memorize;
