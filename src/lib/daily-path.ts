import type { Quest } from "../types"

export const pickDailyQuest = (
  quests: Quest[],
  classLevel: string,
  completedIds: string[],
  weeklyTopics = "",
  isPremium = false,
  date = new Date()
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

  const dayKey = date.toISOString().split("T")[0]
  const hash = dayKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return eligible[hash % eligible.length]
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
