import type { Quest, SyncedPupil, SyncLog } from "../dbManagerCore"

export interface DataPort {
  getQuests(): Promise<Quest[]>
  publishQuest(quest: Quest): Promise<void>
  syncPupil(
    pupil: Partial<SyncedPupil> & { id: string; name: string },
    deltaPoints?: number
  ): Promise<SyncedPupil[]>
  getStudentsAndLogs(): Promise<{ students: SyncedPupil[]; logs: SyncLog[] }>
}

export type DeploymentMode = "pi" | "cloud" | "hybrid"

export const resolveDeploymentMode = (): DeploymentMode => {
  const explicit = process.env.DEPLOYMENT_MODE as DeploymentMode | undefined
  if (explicit === "pi" || explicit === "cloud" || explicit === "hybrid") return explicit
  if (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT) return "hybrid"
  return "pi"
}
