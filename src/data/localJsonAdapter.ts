import fs from "fs"
import path from "path"
import type { Quest, SyncedPupil, SyncLog } from "../dbManagerCore"
import type { DataPort } from "./ports"

const DB_FILE = path.join(process.cwd(), "classroom_db.json")

interface LocalCache {
  quests: Quest[]
  pupils: SyncedPupil[]
  logs: SyncLog[]
}

export class LocalJsonAdapter implements DataPort {
  private cache: LocalCache

  constructor(initial: LocalCache) {
    this.cache = { ...initial, quests: [...initial.quests], pupils: [...initial.pupils], logs: [...initial.logs] }
    this.loadFromDisk(initial)
  }

  private loadFromDisk(fallback: LocalCache) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"))
        this.cache.quests = parsed.quests || fallback.quests
        this.cache.pupils = parsed.pupils || fallback.pupils
        this.cache.logs = parsed.logs || fallback.logs
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

  async getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }> {
    return {
      students: this.cache.pupils.sort((a, b) => b.points - a.points),
      logs: this.cache.logs,
    }
  }
}
