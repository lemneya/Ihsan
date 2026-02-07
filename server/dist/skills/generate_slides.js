"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const generateSlides = {
    name: "generate_slides",
    description: "Create a visual presentation slide deck. Use this WHENEVER the user asks for slides, a deck, or a presentation. " +
        "This tool streams slides in real time to the UI.",
    parameters: zod_1.z.object({
        topic: zod_1.z.string().describe("The presentation topic or full prompt"),
        slides_count: zod_1.z
            .number()
            .default(5)
            .describe("Approximate number of slides to generate"),
    }),
    execute: async (params) => {
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
exports.default = generateSlides;
