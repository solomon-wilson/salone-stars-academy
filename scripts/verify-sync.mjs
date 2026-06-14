#!/usr/bin/env node
/**
 * Verify sync endpoint idempotency and leaderboard response shape.
 * In Pi mode: full LWW merge test. In cloud/hybrid: verifies auth is required.
 * Usage: node scripts/verify-sync.mjs [baseUrl]
 */
const baseUrl = process.argv[2] || "http://localhost:3000"

const pupil = {
  id: `verify-pupil-${Date.now()}`,
  name: "Verify Test Pupil",
  class_level: "Class 4",
  points: 100,
  streak_count: 2,
  last_active_date: new Date().toISOString().split("T")[0],
  badges_earned: ["Bintumani Climber"],
  delta_points: 20,
}

const run = async () => {
  const health = await fetch(`${baseUrl}/health`)
  if (!health.ok) throw new Error(`Health check failed: ${health.status}`)
  const healthData = await health.json()
  console.log("✓ GET /health OK — mode:", healthData.deploymentMode)

  const sync1 = await fetch(`${baseUrl}/api/v1/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pupil),
  })

  if (healthData.deploymentMode !== "pi") {
    if (sync1.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated sync in ${healthData.deploymentMode} mode, got ${sync1.status}`)
    }
    const err = await sync1.json()
    if (!err.error?.code) throw new Error("Sync 401 missing standard error envelope")
    console.log("✓ POST /api/v1/sync requires auth in", healthData.deploymentMode, "mode")
    console.log("\nSync verification checks passed (auth gate).")
    return
  }

  if (!sync1.ok) throw new Error(`Sync failed: ${sync1.status}`)
  const data1 = await sync1.json()
  if (!data1.success || !Array.isArray(data1.serverLeaderboard)) {
    throw new Error("Invalid sync response shape")
  }
  console.log("✓ POST /api/v1/sync OK — leaderboard entries:", data1.serverLeaderboard.length)

  const sync2 = await fetch(`${baseUrl}/api/v1/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...pupil, points: 80, delta_points: 0 }),
  })
  const data2 = await sync2.json()
  const entry = data2.serverLeaderboard.find((s) => s.id === pupil.id)
  if (!entry || entry.points < 100) {
    throw new Error("LWW max(points) merge failed — points regressed")
  }
  console.log("✓ LWW max(points) preserved:", entry.points)
  console.log("\nAll sync verification checks passed.")
}

run().catch(err => {
  console.error("✗", err.message)
  process.exit(1)
})
