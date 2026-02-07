/**
 * test-registry.ts — Phase 3 Verification Script
 *
 * Simulates the server startup sequence and API responses
 * without actually binding to a network port.
 */

import { SkillRegistry } from "./src/agent-os/skill-registry";

async function main() {
  console.log("=== Phase 3 Verification ===\n");

  // 1. Create global registry (same as server/index.ts line 16)
  const globalRegistry = new SkillRegistry();

  // 2. Load skills (same as server startup, line 340)
  await globalRegistry.loadSkills();
  console.log("\n🔌 [Ihsan OS] Global Skill Registry Loaded\n");

  // 3. Simulate GET /api/skills (same as server line 167-168)
  const hardcodedSkills = [
    { id: "slides", title: "slides-generator", desc: "Create professional presentation slides", enabled: true, official: true, tools: ["generate_slides"] },
    { id: "deep", title: "deep-research", desc: "Conduct thorough research", enabled: true, official: true, tools: ["web_search", "web_fetch"] },
  ];
  const dynamicSkills = globalRegistry.toApiResponse();
  const apiResponse = [...hardcodedSkills, ...dynamicSkills];

  console.log("--- GET /api/skills ---");
  console.log(JSON.stringify(apiResponse, null, 2));

  // 4. Verify browser_search is present
  const hasBrowserSearch = apiResponse.some((s) => s.id === "browser_search");
  console.log(`\n✅ browser_search present in API: ${hasBrowserSearch}`);

  // 5. Simulate toggle (same as server line 210)
  console.log("\n--- PUT /api/skills/browser_search/toggle ---");
  const toggled = globalRegistry.toggleSkill("browser_search");
  console.log(JSON.stringify(toggled, null, 2));

  // 6. Verify it's now disabled in tool definitions
  const toolDefs = globalRegistry.getToolDefinitions();
  const browserSearchTool = "browser_search" in toolDefs;
  console.log(`\nbrowser_search in tool definitions after toggle: ${browserSearchTool}`);

  // 7. Toggle back on
  globalRegistry.toggleSkill("browser_search");
  const toolDefsAfter = globalRegistry.getToolDefinitions();
  const browserSearchToolBack = "browser_search" in toolDefsAfter;
  console.log(`browser_search in tool definitions after re-toggle: ${browserSearchToolBack}`);

  // 8. Test getEnabledSkills
  console.log(`\nEnabled skills: ${globalRegistry.getEnabledSkills().map((s) => s.name).join(", ")}`);

  // 9. Test prompt context
  console.log("\n--- System Prompt Context ---");
  console.log(globalRegistry.getSkillsPromptContext());

  console.log("\n=== All Phase 3 Checks Complete ===");
}

main().catch(console.error);
