import { useMemo } from "react"
import type { Quest } from "../../../types"
import { pickDailyQuest } from "../../../lib/daily-path"

type UseDailyPathArgs = {
  quests: Quest[]
  classLevel: string
  completedQuests: Record<string, boolean>
  weeklyTopics: string
  isPremium: boolean
}

export const useDailyPath = ({
  quests,
  classLevel,
  completedQuests,
  weeklyTopics,
  isPremium,
}: UseDailyPathArgs) => {
  const completedIds = useMemo(
    () => Object.keys(completedQuests).filter(id => completedQuests[id]),
    [completedQuests]
  )

  const dailyQuest = useMemo(
    () => pickDailyQuest(quests, classLevel, completedIds, weeklyTopics, isPremium),
    [quests, classLevel, completedIds, weeklyTopics, isPremium]
  )

  const subjectsThisWeek = useMemo(() => {
    const subjects = new Set<string>()
    quests
      .filter(q => q.class_level === classLevel && completedIds.includes(q.id))
      .forEach(q => subjects.add(q.subject))
    return Array.from(subjects)
  }, [quests, classLevel, completedIds])

  return { dailyQuest, completedIds, subjectsThisWeek }
}
