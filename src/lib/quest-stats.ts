export type QuestAttemptStats = {
  questId: string
  subject: string
  correct: number
  total: number
  completedAt?: string
}

export type SubjectStatsSummary = Record<string, { correct: number; total: number }>

export const getQuestStatsKey = (childId: string) => `salone_stars_quest_stats_${childId}`

export const loadQuestStats = (childId: string): QuestAttemptStats[] => {
  const saved = localStorage.getItem(getQuestStatsKey(childId))
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveQuestStats = (childId: string, stats: QuestAttemptStats[]) => {
  localStorage.setItem(getQuestStatsKey(childId), JSON.stringify(stats))
}

export const recordAnswerAttempt = (
  childId: string,
  questId: string,
  subject: string,
  isCorrect: boolean
) => {
  const stats = loadQuestStats(childId)
  const idx = stats.findIndex(s => s.questId === questId && !s.completedAt)
  if (idx === -1) {
    stats.push({
      questId,
      subject,
      correct: isCorrect ? 1 : 0,
      total: 1,
    })
  } else {
    stats[idx] = {
      ...stats[idx],
      correct: stats[idx].correct + (isCorrect ? 1 : 0),
      total: stats[idx].total + 1,
    }
  }
  saveQuestStats(childId, stats)
}

export const markQuestCompleted = (childId: string, questId: string, subject: string) => {
  const stats = loadQuestStats(childId)
  const idx = stats.findIndex(s => s.questId === questId)
  const today = new Date().toISOString().split("T")[0]
  if (idx === -1) {
    stats.push({ questId, subject, correct: 0, total: 0, completedAt: today })
  } else {
    stats[idx] = { ...stats[idx], completedAt: today }
  }
  saveQuestStats(childId, stats)
}

export const summarizeSubjectStats = (stats: QuestAttemptStats[]): SubjectStatsSummary => {
  const summary: SubjectStatsSummary = {}
  for (const stat of stats) {
    if (!stat.subject) continue
    const entry = summary[stat.subject] ?? { correct: 0, total: 0 }
    entry.correct += stat.correct
    entry.total += stat.total
    summary[stat.subject] = entry
  }
  return summary
}

export const getActiveDatesFromStats = (stats: QuestAttemptStats[]): string[] => {
  const dates = new Set<string>()
  for (const stat of stats) {
    if (stat.completedAt) dates.add(stat.completedAt)
  }
  return Array.from(dates)
}
