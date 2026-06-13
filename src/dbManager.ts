import type { Quest, SyncedPupil, SyncLog } from "./dbManagerCore"
import { LocalJsonAdapter } from "./data/localJsonAdapter"
import { HybridDataAdapter } from "./data/firestoreAdapter"
import { resolveDeploymentMode } from "./data/ports"
import type { DataPort } from "./data/ports"

export type { Quest, Question, SyncedPupil, SyncLog, SyncedStudent } from "./dbManagerCore"
export { INITIAL_QUESTS, INITIAL_PUPILS, INITIAL_LOGS } from "./dbManagerCore"

import {
  INITIAL_QUESTS,
  INITIAL_PUPILS,
  INITIAL_LOGS,
} from "./dbManagerCore"

export class DatabaseManager {
  private static instance: DatabaseManager
  private adapter: DataPort
  private deploymentMode: ReturnType<typeof resolveDeploymentMode>

  private constructor() {
    this.deploymentMode = resolveDeploymentMode()
    const local = new LocalJsonAdapter({
      quests: INITIAL_QUESTS,
      pupils: INITIAL_PUPILS,
      logs: INITIAL_LOGS,
    })

    if (this.deploymentMode === "cloud" || this.deploymentMode === "hybrid") {
      this.adapter = new HybridDataAdapter(local)
      console.log(`[Data Engine] ${this.deploymentMode} mode — local JSON + Firestore sync`)
    } else {
      this.adapter = local
      console.log("[Data Engine] Pi offline mode — classroom_db.json")
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  public getDeploymentMode() {
    return this.deploymentMode
  }

  public async getQuests(): Promise<Quest[]> {
    return this.adapter.getQuests()
  }

  public async publishQuest(quest: Quest): Promise<void> {
    return this.adapter.publishQuest(quest)
  }

  public async syncPupil(
    pupil: Partial<SyncedPupil> & { id: string; name: string; teacherId?: string },
    deltaPoints = 0
  ): Promise<SyncedPupil[]> {
    return this.adapter.syncPupil(pupil, deltaPoints)
  }

  public async getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }> {
    return this.adapter.getStudentsAndLogs()
  }
}
