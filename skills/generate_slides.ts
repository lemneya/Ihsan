/**
 * generate_slides.ts — Dynamic Slide Generation Skill
 *
 * This skill intercepts presentation requests and returns a
 * STREAM_SLIDES marker so the agent can delegate to the real-time
 * streaming slide generator (IhsanAgent.generateSlides).
 *
 * Why a marker? The Skill.execute() function is sandboxed — it has
 * no access to the socket. So we return a special object that the
 * agent's execute() method detects and handles by calling
 * this.generateSlides() which emits slides:slide events in real time.
 */

import { z } from "zod";
import type { Skill } from "../src/agent-os/types/skill.interface";

const generateSlides: Skill = {
  name: "generate_slides",
  description:
    "Create a visual presentation slide deck. Use this WHENEVER the user asks for slides, a deck, or a presentation. " +
    "This tool streams slides in real time to the UI.",

  parameters: z.object({
    topic: z.string().describe("The presentation topic or full prompt"),
    slides_count: z
      .number()
      .default(5)
      .describe("Approximate number of slides to generate"),
  }),

  execute: async (params: { topic: string; slides_count: number }) => {
    // Return the STREAM_SLIDES marker — the agent intercepts this
    // and delegates to IhsanAgent.generateSlides() for real-time
    // socket streaming instead of returning a static result.
    return {
      _action: "STREAM_SLIDES",
      topic: params.topic,
      count: params.slides_count,
    };
  },
};

export default generateSlides;
