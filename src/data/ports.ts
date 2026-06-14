import type { Quest, SyncedPupil, SyncLog } from "../dbManagerCore"

export interface QuestPage {
  quests: Quest[]
  nextCursor: string | null
}

export interface DataPort {
  getQuests(): Promise<Quest[]>
  getQuestsByFilter(classLevel?: string, subject?: string, cursor?: string, limit?: number): Promise<QuestPage>
  publishQuest(quest: Quest): Promise<void>
  syncPupil(
    pupil: Partial<SyncedPupil> & { id: string; name: string },
    deltaPoints?: number
  ): Promise<SyncedPupil[]>
  syncPupilBatch(
    pupils: Array<Partial<SyncedPupil> & { id: string; name: string }>,
    actorUid: string
  ): Promise<Array<{ pupilId: string; success: boolean; error?: string }>>
  getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }>
}

export type DeploymentMode = "pi" | "cloud" | "hybrid"

export const resolveDeploymentMode = (): DeploymentMode => {
  const explicit = process.env.DEPLOYMENT_MODE as DeploymentMode | undefined
  if (explicit === "pi" || explicit === "cloud" || explicit === "hybrid") return explicit
  if (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT) return "hybrid"
  return "pi"
}
