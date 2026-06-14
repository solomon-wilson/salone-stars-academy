import type { Quest } from "../types"

export type CompletionMeta = {
  completedAt: string
  subject: string
  pointsAward: number
}

const DAILY_PICK_HISTORY_KEY = (childId: string) => `salone_stars_daily_picks_${childId}`
const COMPLETION_META_KEY = (childId: string) => `salone_stars_completed_meta_${childId}`

export const getRecentDailySubjects = (childId: string): string[] => {
  const saved = localStorage.getItem(DAILY_PICK_HISTORY_KEY(childId))
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const recordDailyPick = (childId: string, subject: string, date = new Date()) => {
  const dayKey = date.toISOString().split("T")[0]
  const saved = localStorage.getItem(DAILY_PICK_HISTORY_KEY(childId))
  let history: { date: string; subject: string }[] = []
  if (saved) {
    try {
      history = JSON.parse(saved)
    } catch {
      history = []
    }
  }
  history = history.filter(h => h.date !== dayKey)
  history.push({ date: dayKey, subject })
  if (history.length > 7) history = history.slice(-7)
  localStorage.setItem(DAILY_PICK_HISTORY_KEY(childId), JSON.stringify(history))
}

const getRecentSubjectsFromHistory = (childId: string): string[] => {
  const saved = localStorage.getItem(DAILY_PICK_HISTORY_KEY(childId))
  if (!saved) return []
  try {
    const history: { date: string; subject: string }[] = JSON.parse(saved)
    return history.slice(-3).map(h => h.subject)
  } catch {
    return []
  }
}

export const pickDailyQuest = (
  quests: Quest[],
  classLevel: string,
  completedIds: string[],
  weeklyTopics = "",
  isPremium = false,
  date = new Date(),
  childId?: string
): Quest | null => {
  let eligible = quests.filter(
    q => q.class_level === classLevel && !completedIds.includes(q.id)
  )

  if (eligible.length === 0) {
    eligible = quests.filter(q => !completedIds.includes(q.id))
  }
  if (eligible.length === 0) return null

  if (isPremium && weeklyTopics.trim()) {
    const keywords = weeklyTopics
      .toLowerCase()
      .split(/[,;\n]+/)
      .map(k => k.trim())
      .filter(Boolean)
    const topicMatches = eligible.filter(q => {
      const haystack = `${q.title} ${q.subject}`.toLowerCase()
      return keywords.some(k => haystack.includes(k))
    })
    if (topicMatches.length > 0) eligible = topicMatches
  }

  const recentSubjects = childId ? getRecentSubjectsFromHistory(childId) : []
  if (recentSubjects.length >= 2) {
    const lastSubject = recentSubjects[recentSubjects.length - 1]
    const sameSubjectRun = recentSubjects.filter(s => s === lastSubject).length
    if (sameSubjectRun >= 2) {
      const rotated = eligible.filter(q => q.subject !== lastSubject)
      if (rotated.length > 0) eligible = rotated
    }
  }

  const attemptedSubjects = new Set(
    quests.filter(q => completedIds.includes(q.id)).map(q => q.subject)
  )
  const unattempted = eligible.filter(q => !attemptedSubjects.has(q.subject))
  if (unattempted.length > 0 && isPremium) eligible = unattempted

  const dayKey = date.toISOString().split("T")[0]
  const hash = dayKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const picked = eligible[hash % eligible.length]

  if (picked && childId) {
    recordDailyPick(childId, picked.subject, date)
  }

  return picked
}

export const getChildProfileKey = (childId: string) => `salone_stars_pupil_profile_${childId}`

export const getChildCompletedKey = (childId: string) => `salone_stars_completed_quests_${childId}`

export const getActiveChildKey = () => "salone_stars_active_child_id"

export const loadChildProfile = (childId: string, fallbackName: string, fallbackClass: string) => {
  const saved = localStorage.getItem(getChildProfileKey(childId))
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      /* fall through */
    }
  }
  return {
    id: childId,
    name: fallbackName,
    class_level: fallbackClass,
    points: 0,
    streak_count: 0,
    last_active_date: new Date().toISOString().split("T")[0],
    badges_earned: [] as string[],
    streak_freezes: 0,
  }
}

export const loadChildCompletedQuests = (childId: string): Record<string, boolean> => {
  const saved = localStorage.getItem(getChildCompletedKey(childId))
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return {}
    }
  }
  return {}
}

export const loadCompletionMeta = (childId: string): Record<string, CompletionMeta> => {
  const saved = localStorage.getItem(COMPLETION_META_KEY(childId))
  if (!saved) return {}
  try {
    return JSON.parse(saved)
  } catch {
    return {}
  }
}

export const saveCompletionMeta = (
  childId: string,
  questId: string,
  meta: CompletionMeta
) => {
  const existing = loadCompletionMeta(childId)
  existing[questId] = meta
  localStorage.setItem(COMPLETION_META_KEY(childId), JSON.stringify(existing))
}

export const pickFallbackDefaultQuest = (
  quests: Quest[],
  classLevel: string
): Quest | null => {
  const isSeeded = (q: Quest) => q.source === "default" || q.source === "bank"
  const classMatches = quests.filter(q => isSeeded(q) && q.class_level === classLevel)
  if (classMatches.length > 0) return classMatches[0]
  const anyClass = quests.filter(isSeeded)
  return anyClass[0] ?? quests[0] ?? null
}
