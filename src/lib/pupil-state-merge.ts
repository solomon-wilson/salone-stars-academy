import type { FirestorePupil } from "../firebaseDb"
import type { PupilProfile } from "../types"
import { getWeekKey } from "../constants/parent"
import { loadChildCompletedQuests, loadChildProfile, loadCompletionMeta } from "./daily-path"
import { getActiveDatesFromStats, loadQuestStats } from "./quest-stats"

export type MergedPupilState = {
  id: string
  name: string
  class_level: string
  points: number
  streak_count: number
  last_active_date: string
  badges_earned: string[]
  pointsThisWeek: number
  subjectsThisWeek: string[]
  pendingSync: boolean
  syncStale: boolean
  syncedAt: number
}

const STALE_SYNC_MS = 7 * 24 * 60 * 60 * 1000

const getWeekStartIso = (date = new Date()): string => {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split("T")[0]
}

export const mergePupilState = (
  remote: FirestorePupil | null,
  childId: string,
  fallbackName: string,
  fallbackClass: string
): MergedPupilState => {
  const local = loadChildProfile(childId, fallbackName, fallbackClass) as PupilProfile
  const stats = loadQuestStats(childId)
  const completionMeta = loadCompletionMeta(childId)
  const weekStart = getWeekStartIso()

  const remotePoints = remote?.points ?? 0
  const localPoints = local.points ?? 0
  const points = Math.max(remotePoints, localPoints)
  const streak_count = Math.max(remote?.streak_count ?? 0, local.streak_count ?? 0)
  const badges_earned = Array.from(
    new Set([...(remote?.badges_earned ?? []), ...(local.badges_earned ?? [])])
  )

  const remoteDate = remote?.last_active_date ?? ""
  const localDate = local.last_active_date ?? ""
  const last_active_date = remoteDate >= localDate ? remoteDate : localDate

  const pendingSync =
    localPoints > remotePoints ||
    local.streak_count > (remote?.streak_count ?? 0) ||
    badges_earned.length > (remote?.badges_earned?.length ?? 0)

  const syncedAt = remote?.synced_at ?? 0
  const syncStale = syncedAt > 0 && Date.now() - syncedAt > STALE_SYNC_MS

  const subjectsSet = new Set<string>()
  let pointsThisWeek = 0

  for (const stat of stats) {
    if (stat.completedAt && stat.completedAt >= weekStart) {
      pointsThisWeek += stat.correct * 20
      if (stat.subject) subjectsSet.add(stat.subject)
    }
  }

  if (pointsThisWeek === 0) {
    for (const [, meta] of Object.entries(completionMeta)) {
      if (meta.completedAt >= weekStart) {
        if (meta.subject) subjectsSet.add(meta.subject)
        pointsThisWeek += meta.pointsAward ?? 0
      }
    }
  }

  void getWeekKey()

  return {
    id: childId,
    name: remote?.name ?? local.name ?? fallbackName,
    class_level: remote?.class_level ?? local.class_level ?? fallbackClass,
    points,
    streak_count,
    last_active_date,
    badges_earned,
    pointsThisWeek,
    subjectsThisWeek: Array.from(subjectsSet),
    pendingSync,
    syncStale,
    syncedAt,
  }
}
