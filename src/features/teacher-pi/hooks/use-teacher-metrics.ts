import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api-client"
import type { SyncedStudent, SyncLog } from "../../../types"

export function useTeacherMetrics(activeTab: string) {
  const [syncedStudents, setSyncedStudents] = useState<SyncedStudent[]>([])
  const [serverLogs, setServerLogs] = useState<SyncLog[]>([])
  const [loadingServerStats, setLoadingServerStats] = useState(false)

  const refreshMetrics = async () => {
    setLoadingServerStats(true)
    try {
      const response = await apiFetch("/api/teacher/students")
      if (response.ok) {
        const data = await response.json()
        setSyncedStudents(data.students)
        setServerLogs(data.logs)
      }
    } catch (e) {
      console.error("Local sync database is inaccessible", e)
    } finally {
      setLoadingServerStats(false)
    }
  }

  useEffect(() => {
    if (activeTab === "teacher") {
      refreshMetrics()
    }
  }, [activeTab])

  return { syncedStudents, serverLogs, loadingServerStats, refreshMetrics }
}
