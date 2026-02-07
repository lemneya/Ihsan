"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSkillsContext = buildSkillsContext;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
// Spec files to load from each skill directory
const SPEC_FILES = ["WORKFLOW.md", "QUALITY_GATES.md", "SLIDES_SPEC.md"];
// ─── Load Skill Spec Files ──────────────────────────────────────────
function loadSkillSpecFiles(skillDir) {
    const specs = {};
    const fullDir = node_path_1.default.join(process.cwd(), skillDir);
    for (const file of SPEC_FILES) {
        try {
            const content = node_fs_1.default.readFileSync(node_path_1.default.join(fullDir, file), "utf-8");
            if (content.trim()) {
                specs[file] = content.trim();
            }
        }
        catch {
            // File doesn't exist for this skill — skip
        }
    }
    return specs;
}
/**
 * Extract key sections from SLIDES_SPEC.md for Ihsan's context.
 * Only includes Inputs, Slide Count Rule, and Structure Templates —
 * the inner generate_slides tool has the full spec.
 */
function extractSpecSummary(specContent) {
    const sections = [];
    const inputsMatch = specContent.match(/## Inputs[\s\S]*?(?=## Outputs)/);
    if (inputsMatch)
        sections.push(inputsMatch[0].trim());
    const slideCountMatch = specContent.match(/## Slide Count Rule[\s\S]*?(?=## Structure)/);
    if (slideCountMatch)
        sections.push(slideCountMatch[0].trim());
    const templatesMatch = specContent.match(/## Structure Templates[\s\S]*?(?=## Visual Rules)/);
    if (templatesMatch)
        sections.push(templatesMatch[0].trim());
    return sections.join("\n\n");
}
// ─── Build [ACTIVE SKILLS] System Prompt Section ────────────────────
/**
 * Build the [ACTIVE SKILLS] section for Ihsan's system prompt.
 *
 * For skills WITH a skillDir: includes the full workflow, quality gates,
 * and spec summary so Ihsan can orchestrate the process himself.
 *
 * For skills WITHOUT a skillDir: includes just the one-line description
 * (backward compatible — Ihsan calls the tool directly).
 */
function buildSkillsContext(enabledSkills) {
    if (enabledSkills.length === 0)
        return "";
    const lines = [];
    lines.push("[ACTIVE SKILLS]");
    lines.push("The following skills are enabled. When a skill has a Workflow, follow it step by step — do NOT skip to calling the tool directly.\n");
    for (const skill of enabledSkills) {
        lines.push(`### ${skill.title}`);
        lines.push(`${skill.desc}`);
        lines.push(`Tools: ${skill.tools.join(", ")}`);
        if (skill.skillDir) {
            const specs = loadSkillSpecFiles(skill.skillDir);
            if (specs["WORKFLOW.md"]) {
                lines.push("");
                lines.push("#### Workflow (YOU must follow these steps)");
                lines.push(specs["WORKFLOW.md"]);
            }
            if (specs["QUALITY_GATES.md"]) {
                lines.push("");
                lines.push("#### Quality Gates (validate after generation)");
                lines.push(specs["QUALITY_GATES.md"]);
            }
            if (specs["SLIDES_SPEC.md"]) {
                lines.push("");
                lines.push("#### Spec Rules");
                lines.push(extractSpecSummary(specs["SLIDES_SPEC.md"]));
            }
        }
        lines.push(""); // blank line between skills
    }
    return "\n\n" + lines.join("\n");
}
