export const MAX_PARENT_CHILDREN = 3

export const CLASS_LEVELS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
] as const

/** Approximate SLL equivalent for pricing copy (static; no live FX in v1) */
export const INDIVIDUAL_PRICE_USD = 19.99
export const INDIVIDUAL_PRICE_SLL = 450_000
export const TUTOR_SESSION_SLL_ANCHOR = 150_000

export const PARENT_KRIO = {
  digestTitle: "Yu pikin progress — quick look",
  startPractice: "Start practice — pikin go learn alone",
  dailyPath: "Today homework quest",
  weeklyTopic: "Wetin school teach dis week?",
  upgradeCta: "Unlock daily path — less than private tutor",
  streak: "Streak days",
  starsWeek: "Stars dis week",
  starsTotal: "Stars total",
  lastActive: "Last active",
  subjects: "Subjects attempted",
  badges: "Badges earned",
  syncOk: "Up to date",
  syncPending: "Sync when online",
  syncStale: "Long time since sync — connect Wi‑Fi",
  weakAreas: "Need more practice",
  weeklyEngagement: "Days practiced dis week",
  todayDone: "Today quest done!",
  todayPending: "Today quest not yet done",
  wifiHint: "Wi‑Fi recommended for sync",
  topicPreview: "Tomorrow quest go focus on",
  celebration: "Pikin finish today homework — well done!",
} as const

export const getWeekKey = (date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}
