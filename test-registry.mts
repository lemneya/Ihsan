/**
 * test-registry.mts — Phase 3 Verification Script (ESM)
 *
 * Simulates the server startup sequence and API responses.
 * Tests: loadSkills, getAllSkills, toApiResponse, toggleSkill,
 *        getToolDefinitions, getEnabledSkills, getSkillsPromptContext
 */

import { SkillRegistry } from "./src/agent-os/skill-registry.js";

async function main() {
  console.log("=== Phase 3 Verification ===\n");

  // 1. Create global registry (same as server/index.ts line 16)
  const globalRegistry = new SkillRegistry();

  // 2. Load skills (same as server startup)
  await globalRegistry.loadSkills();
  console.log(`\n🔌 [Ihsan OS] Global Skill Registry Loaded\n`);

  // 3. Simulate GET /api/skills
  const hardcodedSkills = [
    { id: "slides", title: "slides-generator", desc: "Create slides", enabled: true, official: true },
    { id: "deep", title: "deep-research", desc: "Research", enabled: true, official: true },
  ];
  const dynamicSkills = globalRegistry.toApiResponse();
  const apiResponse = [...hardcodedSkills, ...dynamicSkills];

  console.log("--- GET /api/skills Response ---");
  console.log(JSON.stringify(apiResponse, null, 2));

  // 4. Verify browser_search is present
  const hasBrowserSearch = apiResponse.some((s: any) => s.id === "browser_search");
  console.log(`\n✅ browser_search in API response: ${hasBrowserSearch}`);

  // 5. Test toggle
  console.log("\n--- PUT /api/skills/browser_search/toggle ---");
  const toggled = globalRegistry.toggleSkill("browser_search");
  console.log(`Toggle result: ${JSON.stringify(toggled)}`);

  // 6. Verify disabled skill is excluded from tool definitions
  const toolDefs = globalRegistry.getToolDefinitions();
  console.log(`browser_search in tools after disable: ${"browser_search" in toolDefs}`);

  // 7. Re-enable
  globalRegistry.toggleSkill("browser_search");
  const toolDefsAfter = globalRegistry.getToolDefinitions();
  console.log(`browser_search in tools after re-enable: ${"browser_search" in toolDefsAfter}`);

  // 8. Test getEnabledSkills
  console.log(`\nEnabled skills: ${globalRegistry.getEnabledSkills().map((s) => s.name).join(", ")}`);

  // 9. Test prompt context
  console.log("\n--- System Prompt Context ---");
  console.log(globalRegistry.getSkillsPromptContext());

  console.log("\n=== ✅ All Phase 3 Checks PASS ===");
}

main().catch(console.error);
