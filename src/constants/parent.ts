export const MAX_PARENT_CHILDREN = 3

export const CLASS_LEVELS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
] as const

export const PARENT_KRIO = {
  digestTitle: "Yu pikin progress — quick look",
  startPractice: "Start practice — pikin go learn alone",
  dailyPath: "Today homework quest",
  weeklyTopic: "Wetin school teach dis week?",
  upgradeCta: "Unlock daily path — less than private tutor",
} as const

export const getWeekKey = (date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}
