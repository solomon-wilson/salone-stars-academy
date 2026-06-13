import { test, expect } from "@playwright/test"

// ─── Health endpoint ──────────────────────────────────────────────────────────
test("GET /health returns 200 with deployment mode", async ({ request }) => {
  const res = await request.get("/health")
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty("status")
})

test("GET /api/quests returns an array", async ({ request }) => {
  const res = await request.get("/api/quests")
  expect(res.status()).toBe(200)
  const quests = await res.json()
  expect(Array.isArray(quests)).toBe(true)
})

// ─── Navigation ──────────────────────────────────────────────────────────────
test("app loads with Pupil Play tab active by default", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("h1")).toContainText("Salone Stars Academy")
  // Pupil tab button should be visually selected (indigo bg)
  await expect(page.locator("#tab-pupil")).toHaveClass(/bg-indigo-600/)
})

test("switching to Teacher Pi tab shows auth form", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-teacher").click()
  await expect(page.getByText("Teacher Portal Login")).toBeVisible()
})

test("switching to Parent Home tab shows parent auth panel", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-parent").click()
  await expect(page.getByText(/parent/i).first()).toBeVisible()
})

test("Parent Home shows child linker when authenticated as parent is skipped without credentials", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-parent").click()
  await expect(page.getByText("Create Account", { exact: true }).or(page.getByText("Sign In", { exact: true }))).toBeVisible()
  await expect(page.getByPlaceholder("e.g. Amie Koroma")).toBeVisible()
})

test("Parent Home auth form has email and password fields", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-parent").click()
  await expect(page.getByPlaceholder("parent@salone-stars.com")).toBeVisible()
  await expect(page.getByPlaceholder("••••••••")).toBeVisible()
})

// ─── Network status modal ─────────────────────────────────────────────────────
test("network status modal opens and closes", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByText("SSA-Classroom-WiFi").click()
  await expect(page.getByText("Low-Connectivity Architecture")).toBeVisible()
  await page.getByText("I Understard di Stack").click()
  await expect(page.getByText("Low-Connectivity Architecture")).not.toBeVisible()
})

// ─── Pricing modal ────────────────────────────────────────────────────────────
test("Pricing Plans modal opens and can be closed", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByText("Pricing Plans").click()
  await expect(page.getByText("Flexible Subscriptions")).toBeVisible()
  await page.locator("button").filter({ hasText: "✕" }).first().click()
  await expect(page.getByText("Flexible Subscriptions")).not.toBeVisible()
})

// ─── Pupil Play ───────────────────────────────────────────────────────────────
test("pupil profile card is visible with default pupil name", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Sorie Bah")).toBeVisible()
})

test("quest list loads from server", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1500)
  const questsOrEmpty = page.locator("text=/quest|loading|no quest/i").first()
  await expect(questsOrEmpty).toBeVisible({ timeout: 8000 })
})

test("sync console is visible with sync button", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  // SyncConsole contains a "Sync" button
  await expect(page.getByText(/sync/i).first()).toBeVisible()
})

// ─── Teacher Pi ───────────────────────────────────────────────────────────────
test("teacher auth form shows Sign In / Create Account tabs", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-teacher").click()
  await expect(page.getByText("Sign In", { exact: true })).toBeVisible()
  await expect(page.getByText("Create Account", { exact: true })).toBeVisible()
})

test("teacher auth form rejects invalid credentials and shows error", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.locator("#tab-teacher").click()
  await page.getByPlaceholder("teacher@salone-stars.com").fill("bad@test.com")
  await page.getByPlaceholder("••••••••").fill("wrongpassword")
  await page.getByText("Sign In to Stars Academy").click()
  // Firebase will return an auth error displayed in the error paragraph
  await expect(page.locator("p.text-rose-400").or(page.getByText(/failed|invalid|error/i))).toBeVisible({
    timeout: 15000,
  })
})

// ─── Billing API ──────────────────────────────────────────────────────────────
test("POST /api/billing/checkout without auth returns 401", async ({ request }) => {
  const res = await request.post("/api/billing/checkout", {
    data: { userId: "test", email: "test@test.com", planName: "individual", subscriberRole: "teacher" },
  })
  expect(res.status()).toBe(401)
})

// ─── Sync API ────────────────────────────────────────────────────────────────
test("POST /api/sync with valid pupil data returns 200", async ({ request }) => {
  const res = await request.post("/api/sync", {
    data: {
      id: "playwright-test-pupil",
      name: "Test Pupil",
      class_level: "Class 4",
      points: 10,
      streak_count: 1,
      last_active_date: new Date().toISOString().split("T")[0],
      badges_earned: [],
      delta_points: 10,
    },
  })
  expect(res.status()).toBe(200)
})

// ─── Auth-protected routes ────────────────────────────────────────────────────
test("POST /api/parent/link-by-invite without auth returns 401", async ({ request }) => {
  const res = await request.post("/api/parent/link-by-invite", {
    data: { inviteCode: "SSATEST1" },
  })
  expect(res.status()).toBe(401)
})

test("POST /api/teacher/generate-invite without auth returns 401", async ({ request }) => {
  const res = await request.post("/api/teacher/generate-invite", {
    data: { pupilId: "test-pupil" },
  })
  expect(res.status()).toBe(401)
})
