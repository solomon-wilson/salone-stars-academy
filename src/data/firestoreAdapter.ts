import type { Quest, SyncedPupil, SyncLog } from "../dbManagerCore"
import type { DataPort, QuestPage } from "./ports"
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
      const snap = await firestore.collection("quests").limit(200).get()
      if (snap.empty) return this.localFallback.getQuests()
      return snap.docs.map(doc => doc.data() as Quest)
    } catch (error) {
      console.error("[FirestoreAdapter] getQuests fallback:", error)
      return this.localFallback.getQuests()
    }
  }

  async getQuestsByFilter(classLevel?: string, subject?: string, cursor?: string, limit = 50): Promise<QuestPage> {
    const firestore = this.getDb()
    if (!firestore) return this.localFallback.getQuestsByFilter(classLevel, subject, cursor, limit)

    try {
      const cap = Math.min(limit, 200)
      let query: FirebaseFirestore.Query = firestore.collection("quests")
      if (classLevel) query = query.where("class_level", "==", classLevel)
      if (subject) query = query.where("subject", "==", subject)
      if (cursor) {
        const cursorDoc = await firestore.collection("quests").doc(cursor).get()
        if (cursorDoc.exists) query = query.startAfter(cursorDoc)
      }
      const snap = await query.limit(cap + 1).get()
      if (snap.empty) return this.localFallback.getQuestsByFilter(classLevel, subject, cursor, limit)
      const hasMore = snap.docs.length > cap
      const docs = snap.docs.slice(0, cap).map(doc => doc.data() as Quest)
      const nextCursor = hasMore ? docs[docs.length - 1]?.id ?? null : null
      return { quests: docs, nextCursor }
    } catch (error) {
      console.error("[FirestoreAdapter] getQuestsByFilter fallback:", error)
      return this.localFallback.getQuestsByFilter(classLevel, subject, cursor, limit)
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

  async syncPupilBatch(
    pupils: Array<Partial<SyncedPupil> & { id: string; name: string }>,
    _actorUid: string
  ): Promise<Array<{ pupilId: string; success: boolean; error?: string }>> {
    const firestore = this.getDb()
    if (!firestore) return this.localFallback.syncPupilBatch(pupils, _actorUid)

    const capped = pupils.slice(0, 50)
    const results: Array<{ pupilId: string; success: boolean; error?: string }> = []
    const merged: SyncedPupil[] = []

    for (const pupil of capped) {
      try {
        const synced = await this.localFallback.syncPupil(pupil, 0)
        const match = synced.find(p => p.id === pupil.id)
        if (match) merged.push({ ...match, teacherId: pupil.teacherId || match.teacherId })
        results.push({ pupilId: pupil.id, success: true })
      } catch (err) {
        results.push({ pupilId: pupil.id, success: false, error: err instanceof Error ? err.message : "Merge failed" })
      }
    }

    if (merged.length > 0) {
      const batch = firestore.batch()
      for (const p of merged) {
        batch.set(firestore.collection("pupils").doc(p.id), p)
      }
      try {
        await batch.commit()
      } catch (err) {
        console.error("[FirestoreAdapter] syncPupilBatch commit failed:", err)
        throw err
      }
    }

    return results
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
  getQuestsByFilter = (classLevel?: string, subject?: string, cursor?: string, limit?: number) =>
    this.cloud.getQuestsByFilter(classLevel, subject, cursor, limit)
  publishQuest = (quest: Quest) => this.cloud.publishQuest(quest)
  syncPupil = (
    pupil: Partial<SyncedPupil> & { id: string; name: string },
    deltaPoints?: number
  ) => this.cloud.syncPupil(pupil, deltaPoints)
  syncPupilBatch = (
    pupils: Array<Partial<SyncedPupil> & { id: string; name: string }>,
    actorUid: string
  ) => this.cloud.syncPupilBatch(pupils, actorUid)
  getStudentsAndLogs = () => this.local.getStudentsAndLogs()
}
