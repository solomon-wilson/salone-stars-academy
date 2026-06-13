import { useState, useEffect } from "react"
import type { PupilProfile } from "../../../types"
import { DEFAULT_PUPIL_PROFILE } from "../../../constants/facts"

const PROFILE_KEY = "salone_stars_pupil_profile"
const COMPLETED_KEY = "salone_stars_completed_quests"
const UNSYNCED_KEY = "salone_stars_unsynced_points"

export const usePupilProfile = () => {
  const [profile, setProfile] = useState<PupilProfile>(() => {
    const saved = localStorage.getItem(PROFILE_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_PUPIL_PROFILE as PupilProfile
  })

  const [completedQuests, setCompletedQuests] = useState<string[]>(() => {
    const saved = localStorage.getItem(COMPLETED_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const [unsyncedPoints, setUnsyncedPoints] = useState(() => {
    const saved = localStorage.getItem(UNSYNCED_KEY)
    return saved ? parseInt(saved, 10) : 0
  })

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedQuests))
  }, [completedQuests])

  useEffect(() => {
    localStorage.setItem(UNSYNCED_KEY, unsyncedPoints.toString())
  }, [unsyncedPoints])

  return {
    profile,
    setProfile,
    completedQuests,
    setCompletedQuests,
    unsyncedPoints,
    setUnsyncedPoints,
  }
}
