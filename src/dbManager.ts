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
      invites: [],
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

  public async getQuestsByFilter(classLevel?: string, subject?: string, cursor?: string, limit?: number) {
    return this.adapter.getQuestsByFilter(classLevel, subject, cursor, limit)
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

  public async syncPupilBatch(
    pupils: Array<Partial<SyncedPupil> & { id: string; name: string }>,
    actorUid: string
  ) {
    return this.adapter.syncPupilBatch(pupils, actorUid)
  }

  public async getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }> {
    return this.adapter.getStudentsAndLogs()
  }

  private getLocalAdapter(): LocalJsonAdapter {
    if (this.adapter instanceof LocalJsonAdapter) return this.adapter
    if (this.adapter instanceof HybridDataAdapter) return this.adapter.getLocalAdapter()
    throw new Error("Local adapter unavailable")
  }

  public async createPupilInvite(pupilId: string, teacherId: string): Promise<string> {
    return this.getLocalAdapter().createPupilInvite(pupilId, teacherId)
  }

  public async linkPupilByInvite(code: string, parentId: string): Promise<SyncedPupil> {
    const pupil = await this.getLocalAdapter().linkPupilByInvite(code, parentId)
    const firestore = this.deploymentMode !== "pi" ? true : false
    if (firestore) {
      try {
        const { getFirestoreAdmin } = await import("./server/firebaseAdmin")
        const adminDb = getFirestoreAdmin()
        if (adminDb) {
          await adminDb.collection("pupils").doc(pupil.id).set(pupil, { merge: true })
        }
      } catch (error) {
        console.error("[DatabaseManager] linkPupilByInvite cloud write failed:", error)
      }
    }
    return pupil
  }
}
