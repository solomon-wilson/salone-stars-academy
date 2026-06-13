import type { QuestAttemptStats } from "./quest-stats"
import { getActiveDatesFromStats } from "./quest-stats"

export type WeeklyEngagement = {
  activeDays: number
  totalDays: number
  label: string
}

export const getWeakSubjects = (
  stats: QuestAttemptStats[],
  threshold = 0.6
): string[] => {
  const bySubject: Record<string, { correct: number; total: number }> = {}

  for (const stat of stats) {
    if (stat.total === 0) continue
    const entry = bySubject[stat.subject] ?? { correct: 0, total: 0 }
    entry.correct += stat.correct
    entry.total += stat.total
    bySubject[stat.subject] = entry
  }

  return Object.entries(bySubject)
    .filter(([, { correct, total }]) => total >= 3 && correct / total < threshold)
    .map(([subject]) => subject)
}

export const getWeeklyEngagement = (
  stats: QuestAttemptStats[],
  lastActiveDate?: string,
  date = new Date()
): WeeklyEngagement => {
  const activeDates = new Set(getActiveDatesFromStats(stats))
  if (lastActiveDate) activeDates.add(lastActiveDate)

  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)

  let activeDays = 0
  for (let i = 0; i < 7; i++) {
    const iso = d.toISOString().split("T")[0]
    if (activeDates.has(iso)) activeDays += 1
    d.setDate(d.getDate() + 1)
  }

  return {
    activeDays,
    totalDays: 7,
    label: `${activeDays} of 7 days`,
  }
}

export const isDailyQuestCompleted = (
  dailyQuestId: string | null | undefined,
  completedQuests: Record<string, boolean>
): boolean => {
  if (!dailyQuestId) return false
  return Boolean(completedQuests[dailyQuestId])
}

export const getMonthlyPracticeSummary = (stats: QuestAttemptStats[]): {
  daysPracticed: number
  questsCompleted: number
} => {
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const dates = new Set<string>()
  let questsCompleted = 0

  for (const stat of stats) {
    if (stat.completedAt && stat.completedAt >= monthStart) {
      dates.add(stat.completedAt)
      questsCompleted += 1
    }
  }

  return { daysPracticed: dates.size, questsCompleted }
}
