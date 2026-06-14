#!/usr/bin/env node
/**
 * Smoke-test OpenAPI-documented public endpoints.
 * Usage: node scripts/verify-openapi.mjs [baseUrl]
 */
const baseUrl = process.argv[2] || "http://localhost:3000"

const run = async () => {
  const specRes = await fetch(`${baseUrl}/api/openapi.json`)
  if (!specRes.ok) throw new Error(`GET /api/openapi.json failed: ${specRes.status}`)
  const spec = await specRes.json()
  if (!spec.openapi?.startsWith("3.")) throw new Error("Invalid OpenAPI document")
  console.log("✓ OpenAPI spec available —", spec.info?.title, spec.info?.version)

  const docsRes = await fetch(`${baseUrl}/api/docs`)
  if (!docsRes.ok) throw new Error(`GET /api/docs failed: ${docsRes.status}`)
  console.log("✓ Swagger UI portal reachable")

  const healthRes = await fetch(`${baseUrl}/api/v1/health`)
  if (!healthRes.ok) throw new Error(`GET /api/v1/health failed: ${healthRes.status}`)
  const health = await healthRes.json()
  if (health.status !== "ok") throw new Error("Health check returned non-ok status")
  console.log("✓ GET /api/v1/health OK — deployment:", health.deploymentMode)

  const questsRes = await fetch(`${baseUrl}/api/v1/quests`)
  if (!questsRes.ok) throw new Error(`GET /api/v1/quests failed: ${questsRes.status}`)
  const quests = await questsRes.json()
  if (!Array.isArray(quests)) throw new Error("Quest list is not an array")
  console.log("✓ GET /api/v1/quests OK —", quests.length, "quests")

  const legacyRes = await fetch(`${baseUrl}/api/quests`)
  if (!legacyRes.ok) throw new Error(`GET /api/quests (legacy) failed: ${legacyRes.status}`)
  if (legacyRes.headers.get("deprecation") !== "true") {
    console.warn("⚠ Legacy route missing Deprecation header")
  } else {
    console.log("✓ Legacy /api/quests includes Deprecation header")
  }

  const protectedRes = await fetch(`${baseUrl}/api/v1/teacher/students`)
  if (protectedRes.status !== 401) {
    throw new Error(`Expected 401 on unauthenticated teacher route, got ${protectedRes.status}`)
  }
  const errBody = await protectedRes.json()
  if (!errBody.error?.code) throw new Error("Protected route missing standard error envelope")
  console.log("✓ Unauthenticated teacher route returns standard error envelope")

  console.log("\nOpenAPI verification checks passed.")
}

run().catch(err => {
  console.error("✗", err.message)
  process.exit(1)
})
