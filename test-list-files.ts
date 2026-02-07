import listFiles from "./skills/list_files";

async function run() {
  let passed = 0;
  let failed = 0;

  function check(name: string, condition: boolean) {
    if (condition) { console.log("  ✅ " + name); passed++; }
    else { console.log("  ❌ " + name); failed++; }
  }

  // Test 1: List project root (non-recursive)
  console.log("\n=== Test 1: Root listing (non-recursive) ===\n");
  const root = await listFiles.execute({ dir_path: ".", recursive: false, depth: 1 });
  console.log(root.tree);
  console.log("\n" + root.summary);
  check("Root listing returned entries", root.entries.length > 0);
  check("Root has tree string", root.tree.length > 0);
  check("Root has skills/ dir", root.entries.some((e: any) => e.name === "skills" && e.type === "dir"));
  check("Root has src/ dir", root.entries.some((e: any) => e.name === "src" && e.type === "dir"));
  check("Root skips node_modules", !root.entries.some((e: any) => e.name === "node_modules"));
  check("Root skips .git", !root.entries.some((e: any) => e.name === ".git"));

  // Test 2: List skills/ directory
  console.log("\n=== Test 2: Skills directory ===\n");
  const skills = await listFiles.execute({ dir_path: "skills", recursive: false, depth: 1 });
  console.log(skills.tree);
  console.log("\n" + skills.summary);
  check("Skills has write_file.ts", skills.entries.some((e: any) => e.name === "write_file.ts"));
  check("Skills has list_files.ts", skills.entries.some((e: any) => e.name === "list_files.ts"));
  check("Skills has browser_search.ts", skills.entries.some((e: any) => e.name === "browser_search.ts"));
  check("Skills has generate_slides.ts", skills.entries.some((e: any) => e.name === "generate_slides.ts"));
  check("Skills has memorize.ts", skills.entries.some((e: any) => e.name === "memorize.ts"));

  // Test 3: List src/ recursively
  console.log("\n=== Test 3: src/ recursive (depth 3) ===\n");
  const src = await listFiles.execute({ dir_path: "src", recursive: true, depth: 3 });
  console.log(src.tree);
  console.log("\n" + src.summary);
  check("src/ has agent-os/ dir", src.entries.some((e: any) => e.name === "agent-os" && e.type === "dir"));
  // Find agent-os children
  const agentOs = src.entries.find((e: any) => e.name === "agent-os");
  check("agent-os/ has agent.ts", agentOs?.children?.some((e: any) => e.name === "agent.ts"));
  check("agent-os/ has safety.ts", agentOs?.children?.some((e: any) => e.name === "safety.ts"));
  check("agent-os/ has types/ dir", agentOs?.children?.some((e: any) => e.name === "types" && e.type === "dir"));
  const types = agentOs?.children?.find((e: any) => e.name === "types");
  check("types/ has skill.interface.ts", types?.children?.some((e: any) => e.name === "skill.interface.ts"));

  // Test 4: Safety — reject absolute path
  console.log("\n=== Test 4: Safety checks ===\n");
  try {
    await listFiles.execute({ dir_path: "/etc", recursive: false, depth: 1 });
    check("Rejects absolute path", false);
  } catch (err: any) {
    check("Rejects absolute path", err.message.includes("ACCESS DENIED"));
  }

  // Test 5: Safety — reject path traversal
  try {
    await listFiles.execute({ dir_path: "../../..", recursive: false, depth: 1 });
    check("Rejects path traversal", false);
  } catch (err: any) {
    check("Rejects path traversal", err.message.includes("ACCESS DENIED"));
  }

  // Test 6: Non-existent directory
  try {
    await listFiles.execute({ dir_path: "nonexistent_dir", recursive: false, depth: 1 });
    check("Rejects non-existent dir", false);
  } catch (err: any) {
    check("Rejects non-existent dir", err.message.includes("not found"));
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
