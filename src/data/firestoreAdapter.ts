import type { Quest, SyncedPupil, SyncLog } from "../dbManagerCore"
import type { DataPort } from "./ports"
import { getFirestoreAdmin } from "../server/firebaseAdmin"
import { LocalJsonAdapter } from "./localJsonAdapter"

export class FirestoreAdapter implements DataPort {
  private localFallback: LocalJsonAdapter

  constructor(localFallback: LocalJsonAdapter) {
    this.localFallback = localFallback
  }

  private getDb() {
    return getFirestoreAdmin()
  }

  async getQuests(): Promise<Quest[]> {
    const firestore = this.getDb()
    if (!firestore) return this.localFallback.getQuests()

    try {
      const snap = await firestore.collection("quests").get()
      if (snap.empty) return this.localFallback.getQuests()
      return snap.docs.map(doc => doc.data() as Quest)
    } catch (error) {
      console.error("[FirestoreAdapter] getQuests fallback:", error)
      return this.localFallback.getQuests()
    }
  }

  async publishQuest(quest: Quest): Promise<void> {
    await this.localFallback.publishQuest(quest)
    const firestore = this.getDb()
    if (!firestore) return

    try {
      await firestore.collection("quests").doc(quest.id).set(quest)
    } catch (error) {
      console.error("[FirestoreAdapter] publishQuest cloud write failed:", error)
    }
  }

  async syncPupil(
    pupil: Partial<SyncedPupil> & { id: string; name: string; teacherId?: string },
    deltaPoints = 0
  ): Promise<SyncedPupil[]> {
    const merged = await this.localFallback.syncPupil(pupil, deltaPoints)
    const firestore = this.getDb()
    if (!firestore) return merged

    const synced = merged.find(p => p.id === pupil.id)
    if (!synced) return merged

    try {
      await firestore.collection("pupils").doc(synced.id).set({
        ...synced,
        teacherId: pupil.teacherId || synced.id,
      })
    } catch (error) {
      console.error("[FirestoreAdapter] syncPupil cloud write failed:", error)
    }
    return merged
  }

  async getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }> {
    return this.localFallback.getStudentsAndLogs()
  }
}

export class HybridDataAdapter implements DataPort {
  private local: LocalJsonAdapter
  private cloud: FirestoreAdapter

  constructor(local: LocalJsonAdapter) {
    this.local = local
    this.cloud = new FirestoreAdapter(local)
  }

  getLocalAdapter() {
    return this.local
  }

  getQuests = () => this.cloud.getQuests()
  publishQuest = (quest: Quest) => this.cloud.publishQuest(quest)
  syncPupil = (
    pupil: Partial<SyncedPupil> & { id: string; name: string },
    deltaPoints?: number
  ) => this.cloud.syncPupil(pupil, deltaPoints)
  getStudentsAndLogs = () => this.local.getStudentsAndLogs()
}
