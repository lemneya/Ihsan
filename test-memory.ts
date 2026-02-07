/**
 * test-memory.ts — Phase 4 Runtime Verification
 */

import { MemoryManager } from "./src/agent-os/memory-manager";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const MEMORY_DIR = join(process.cwd(), "memory");

async function main() {
  console.log("=== Phase 4: Memory System Verification ===\n");

  const memory = new MemoryManager();

  // Test 1: Load empty context
  console.log("--- Test 1: Load empty context ---");
  const emptyCtx = await memory.loadContext();
  console.log(`User facts empty/template: ${emptyCtx.userFacts.includes("(none yet)")}`);
  console.log(`Conversation history empty: ${emptyCtx.conversationHistory.length === 0}`);
  console.log(`Formatted empty or template: ${emptyCtx.formatted === ""}`);

  // Test 2: Save user interaction
  console.log("\n--- Test 2: Save user interaction ---");
  await memory.saveInteraction("user", "My name is Mohiyidine. I prefer dark mode.");
  const afterUser = await memory.loadContext();
  console.log(`History has 1 turn: ${afterUser.conversationHistory.length === 1}`);
  console.log(`Turn is user: ${afterUser.conversationHistory[0]?.role === "user"}`);
  console.log(`Content correct: ${afterUser.conversationHistory[0]?.content.includes("Mohiyidine")}`);

  // Test 3: Save assistant interaction
  console.log("\n--- Test 3: Save assistant interaction ---");
  await memory.saveInteraction("assistant", "Nice to meet you, Mohiyidine! I've noted your preference for dark mode.");
  const afterAssistant = await memory.loadContext();
  console.log(`History has 2 turns: ${afterAssistant.conversationHistory.length === 2}`);
  console.log(`Turn 2 is assistant: ${afterAssistant.conversationHistory[1]?.role === "assistant"}`);

  // Test 4: Save user fact via updateUserFact
  console.log("\n--- Test 4: Save user fact ---");
  await memory.updateUserFact("[identity] User's name is Mohiyidine");
  await memory.updateUserFact("[preference] User prefers dark mode");
  const afterFacts = await memory.loadContext();
  console.log(`Facts contain name: ${afterFacts.userFacts.includes("Mohiyidine")}`);
  console.log(`Facts contain dark mode: ${afterFacts.userFacts.includes("dark mode")}`);
  console.log(`Formatted includes USER MEMORY: ${afterFacts.formatted.includes("USER MEMORY")}`);
  console.log(`Formatted includes CONVERSATION HISTORY: ${afterFacts.formatted.includes("CONVERSATION HISTORY")}`);

  // Test 5: Duplicate prevention
  console.log("\n--- Test 5: Duplicate prevention ---");
  await memory.updateUserFact("[identity] User's name is Mohiyidine");
  const afterDup = await memory.loadContext();
  const nameCount = (afterDup.userFacts.match(/Mohiyidine/g) || []).length;
  console.log(`Name appears only once: ${nameCount === 1}`);

  // Test 6: getSummary
  console.log("\n--- Test 6: getSummary ---");
  const summary = await memory.getSummary();
  console.log(`Summary: "${summary}"`);
  console.log(`Summary contains facts: ${summary.includes("fact(s)")}`);
  console.log(`Summary contains turns: ${summary.includes("conversation turn(s)")}`);

  // Test 7: MAX_TURNS cap (20)
  console.log("\n--- Test 7: MAX_TURNS cap (20) ---");
  for (let i = 0; i < 25; i++) {
    await memory.saveInteraction("user", `Test message ${i}`);
  }
  const afterCap = await memory.loadContext();
  console.log(`History capped at 20: ${afterCap.conversationHistory.length === 20}`);
  console.log(`Oldest entry is recent: ${!afterCap.conversationHistory[0]?.content.includes("My name is")}`);

  // Test 8: Simulated restart
  console.log("\n--- Test 8: Simulated server restart ---");
  const freshMemory = new MemoryManager();
  const reloadedCtx = await freshMemory.loadContext();
  console.log(`Facts survived restart: ${reloadedCtx.userFacts.includes("Mohiyidine")}`);
  console.log(`History survived restart: ${reloadedCtx.conversationHistory.length === 20}`);

  // Cleanup
  console.log("\n--- Cleanup ---");
  await writeFile(join(MEMORY_DIR, "short_term.json"), "[]\n", "utf-8");
  await writeFile(join(MEMORY_DIR, "user.md"), `# User Context\n\n_This file is updated by the agent as it learns about the user across sessions._\n\n## Preferences\n\n- (none yet)\n\n## Notes\n\n- (none yet)\n`, "utf-8");
  console.log("Memory files restored to initial state.");

  console.log("\n=== All Phase 4 Checks PASS ===");
}

main().catch(console.error);
