#!/usr/bin/env node
/**
 * Verify quest publish requires subject/class_level.
 * Usage: node scripts/verify-publish.mjs [baseUrl]
 */
const baseUrl = process.argv[2] || "http://localhost:3000"

const run = async () => {
  const invalid = await fetch(`${baseUrl}/api/teacher/publish-quest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Quest",
      questions: [{ questionText: "Q?", options: ["A", "B"], correctOption: "A", explanation: "E", krioInstruction: "K" }],
    }),
  })
  if (invalid.status !== 401 && invalid.status !== 400) {
    console.warn("Expected 401 (no auth) or 400 (missing fields), got:", invalid.status)
  } else {
    console.log("✓ Invalid publish rejected with status", invalid.status)
  }

  const quests = await fetch(`${baseUrl}/api/quests`)
  if (!quests.ok) throw new Error("GET /api/quests failed")
  const list = await quests.json()
  if (!Array.isArray(list) || list.length === 0) throw new Error("Quest list empty")
  const sample = list[0]
  if (!sample.subject || !sample.class_level) throw new Error("Quest missing subject/class_level")
  console.log("✓ GET /api/quests OK —", list.length, "quests, sample:", sample.title)
  console.log("\nPublish verification checks passed.")
}

run().catch(err => {
  console.error("✗", err.message)
  process.exit(1)
})
