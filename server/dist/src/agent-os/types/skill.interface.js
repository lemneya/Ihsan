"use strict";
/**
 * skill.interface.ts — The DNA of every Ihsan Skill
 *
 * Every .ts file dropped into /skills must default-export
 * an object that satisfies this interface.
 *
 * The SkillRegistry validates each import against this shape
 * before registering it as an available tool.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSkill = isValidSkill;
const zod_1 = require("zod");
/**
 * Type guard: validates that an unknown import is a valid Skill object.
 * Used by SkillRegistry to safely filter malformed skill files.
 */
function isValidSkill(obj) {
    if (obj === null || typeof obj !== "object")
        return false;
    const candidate = obj;
    return (typeof candidate.name === "string" &&
        candidate.name.length > 0 &&
        typeof candidate.description === "string" &&
        candidate.description.length > 0 &&
        candidate.parameters instanceof zod_1.z.ZodType &&
        typeof candidate.execute === "function");
}
