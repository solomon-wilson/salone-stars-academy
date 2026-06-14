import fs from "fs"
import path from "path"
import type { Quest, SyncedPupil, SyncLog, PupilInvite } from "../dbManagerCore"
import type { DataPort, QuestPage } from "./ports"

const DB_FILE = path.join(process.cwd(), "classroom_db.json")

interface LocalCache {
  quests: Quest[]
  pupils: SyncedPupil[]
  logs: SyncLog[]
  invites: PupilInvite[]
}

export class LocalJsonAdapter implements DataPort {
  private cache: LocalCache

  constructor(initial: LocalCache) {
    this.cache = {
      ...initial,
      quests: [...initial.quests],
      pupils: [...initial.pupils],
      logs: [...initial.logs],
      invites: [...(initial.invites ?? [])],
    }
    this.loadFromDisk(initial)
  }

  private loadFromDisk(fallback: LocalCache) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"))
        this.cache.quests = parsed.quests || fallback.quests
        this.cache.pupils = parsed.pupils || fallback.pupils
        this.cache.logs = parsed.logs || fallback.logs
        this.cache.invites = parsed.invites || fallback.invites || []
      } else {
        this.saveToDisk()
      }
    } catch {
      this.saveToDisk()
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8")
    } catch (error) {
      console.error("[LocalJsonAdapter] Save failed:", error)
    }
  }

  async getQuests(): Promise<Quest[]> {
    return this.cache.quests
  }

  async getQuestsByFilter(classLevel?: string, subject?: string, cursor?: string, limit = 50): Promise<QuestPage> {
    let result = this.cache.quests
    if (classLevel) result = result.filter(q => q.class_level === classLevel)
    if (subject) result = result.filter(q => q.subject === subject)
    const cap = Math.min(limit, 200)
    const startIdx = cursor ? result.findIndex(q => q.id === cursor) + 1 : 0
    const page = result.slice(startIdx, startIdx + cap)
    const nextCursor = startIdx + cap < result.length ? page[page.length - 1]?.id ?? null : null
    return { quests: page, nextCursor }
  }

  async publishQuest(quest: Quest): Promise<void> {
    this.cache.quests.push(quest)
    this.saveToDisk()
  }

  async syncPupil(
    pupil: Partial<SyncedPupil> & { id: string; name: string },
    deltaPoints = 0
  ): Promise<SyncedPupil[]> {
    const existingIndex = this.cache.pupils.findIndex(p => p.id === pupil.id)

    if (existingIndex > -1) {
      const existing = this.cache.pupils[existingIndex]
      const incomingDate = pupil.last_active_date || existing.last_active_date
      const mergedDate = incomingDate >= existing.last_active_date ? incomingDate : existing.last_active_date

      const mergedSubjectStats = { ...(existing.subject_stats ?? {}) }
      if (pupil.subject_stats) {
        for (const [subject, stats] of Object.entries(pupil.subject_stats)) {
          const prev = mergedSubjectStats[subject] ?? { correct: 0, total: 0 }
          mergedSubjectStats[subject] = {
            correct: prev.correct + stats.correct,
            total: prev.total + stats.total,
          }
        }
      }

      this.cache.pupils[existingIndex] = {
        id: pupil.id,
        name: pupil.name,
        class_level: pupil.class_level || existing.class_level,
        points: Math.max(existing.points, pupil.points || 0),
        streak_count: Math.max(existing.streak_count, pupil.streak_count || 0),
        last_active_date: mergedDate,
        badges_earned: Array.from(new Set([...(existing.badges_earned || []), ...(pupil.badges_earned || [])])),
        teacherId: pupil.teacherId || existing.teacherId,
        parentId: pupil.parentId || existing.parentId,
        subject_stats: Object.keys(mergedSubjectStats).length > 0 ? mergedSubjectStats : undefined,
        synced_at: Date.now(),
      }
    } else {
      this.cache.pupils.push({
        id: pupil.id,
        name: pupil.name,
        class_level: pupil.class_level || "Class 4",
        points: pupil.points || 0,
        streak_count: pupil.streak_count || 0,
        last_active_date: pupil.last_active_date || new Date().toISOString().split("T")[0],
        badges_earned: pupil.badges_earned || [],
        teacherId: pupil.teacherId,
        parentId: pupil.parentId,
        subject_stats: pupil.subject_stats,
        synced_at: Date.now(),
      })
    }

    const newLog: SyncLog = {
      id: `sync-log-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      pupil_name: pupil.name,
      delta_points: deltaPoints,
      event_type: `${pupil.class_level || "General"} Sync Upload`,
    }
    this.cache.logs.unshift(newLog)
    if (this.cache.logs.length > 50) this.cache.logs.pop()

    this.saveToDisk()
    return this.cache.pupils.sort((a, b) => b.points - a.points)
  }

  async syncPupilBatch(
    pupils: Array<Partial<SyncedPupil> & { id: string; name: string }>,
    _actorUid: string
  ): Promise<Array<{ pupilId: string; success: boolean; error?: string }>> {
    const results: Array<{ pupilId: string; success: boolean; error?: string }> = []
    for (const pupil of pupils.slice(0, 50)) {
      try {
        await this.syncPupil(pupil, 0)
        results.push({ pupilId: pupil.id, success: true })
      } catch (err) {
        results.push({ pupilId: pupil.id, success: false, error: err instanceof Error ? err.message : "Unknown error" })
      }
    }
    return results
  }

  async getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }> {
    return {
      students: this.cache.pupils.sort((a, b) => b.points - a.points),
      logs: this.cache.logs,
    }
  }

  async createPupilInvite(pupilId: string, teacherId: string): Promise<string> {
    const pupil = this.cache.pupils.find(p => p.id === pupilId && p.teacherId === teacherId)
    if (!pupil) throw new Error("Pupil not found for this teacher.")

    const code = `SSA${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    this.cache.invites = this.cache.invites.filter(i => i.pupilId !== pupilId)
    this.cache.invites.push({ code, pupilId, teacherId, createdAt: Date.now() })
    this.saveToDisk()
    return code
  }

  async linkPupilByInvite(code: string, parentId: string): Promise<SyncedPupil> {
    const invite = this.cache.invites.find(i => i.code === code.toUpperCase())
    if (!invite) throw new Error("Invalid or expired invite code.")

    const idx = this.cache.pupils.findIndex(p => p.id === invite.pupilId)
    if (idx === -1) throw new Error("Pupil record not found.")

    const existing = this.cache.pupils[idx]
    if (existing.parentId && existing.parentId !== parentId) {
      throw new Error("This pupil is already linked to another parent account.")
    }

    this.cache.pupils[idx] = { ...existing, parentId, synced_at: Date.now() }
    this.saveToDisk()
    return this.cache.pupils[idx]
  }
}
