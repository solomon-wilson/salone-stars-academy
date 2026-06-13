import { useMemo } from "react"
import type { Quest } from "../../../types"
import { pickDailyQuest, pickFallbackDefaultQuest } from "../../../lib/daily-path"

type UseDailyPathArgs = {
  quests: Quest[]
  classLevel: string
  completedQuests: Record<string, boolean>
  weeklyTopics: string
  isPremium: boolean
  childId?: string | null
}

export const useDailyPath = ({
  quests,
  classLevel,
  completedQuests,
  weeklyTopics,
  isPremium,
  childId,
}: UseDailyPathArgs) => {
  const completedIds = useMemo(
    () => Object.keys(completedQuests).filter(id => completedQuests[id]),
    [completedQuests]
  )

  const { dailyQuest, isFallback } = useMemo(() => {
    const picked = pickDailyQuest(
      quests,
      classLevel,
      completedIds,
      weeklyTopics,
      isPremium,
      new Date(),
      childId ?? undefined
    )
    if (picked) return { dailyQuest: picked, isFallback: false }
    const fallback = pickFallbackDefaultQuest(quests, classLevel)
    return { dailyQuest: fallback, isFallback: Boolean(fallback) }
  }, [quests, classLevel, completedIds, weeklyTopics, isPremium, childId])

  const subjectsThisWeek = useMemo(() => {
    const subjects = new Set<string>()
    quests
      .filter(q => completedIds.includes(q.id))
      .forEach(q => subjects.add(q.subject))
    return Array.from(subjects)
  }, [quests, completedIds])

  return { dailyQuest, completedIds, subjectsThisWeek, isFallback }
}
