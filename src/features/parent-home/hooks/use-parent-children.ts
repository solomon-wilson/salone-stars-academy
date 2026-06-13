import { useCallback, useEffect, useState } from "react"
import { getPupilsForParent, linkChildToParent, type FirestorePupil } from "../../../firebaseDb"
import { MAX_PARENT_CHILDREN } from "../../../constants/parent"

export const useParentChildren = (parentId: string | undefined) => {
  const [children, setChildren] = useState<FirestorePupil[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(() =>
    localStorage.getItem("salone_stars_active_child_id")
  )

  const refreshChildren = useCallback(async () => {
    if (!parentId) {
      setChildren([])
      return
    }
    setLoading(true)
    try {
      const pupils = await getPupilsForParent(parentId)
      setChildren(pupils)
      if (pupils.length > 0) {
        setSelectedChildId(prev => {
          if (prev && pupils.some(p => p.id === prev)) return prev
          const first = pupils[0].id
          localStorage.setItem("salone_stars_active_child_id", first)
          return first
        })
      }
    } catch (error) {
      console.error("Failed to load linked children:", error)
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    refreshChildren()
  }, [refreshChildren])

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId)
    localStorage.setItem("salone_stars_active_child_id", childId)
  }

  const handleLinkChild = async (name: string, classLevel: string) => {
    if (!parentId) return { ok: false, error: "Not signed in" }
    if (children.length >= MAX_PARENT_CHILDREN) {
      return { ok: false, error: `Individual plan supports up to ${MAX_PARENT_CHILDREN} children.` }
    }
    if (!name.trim()) return { ok: false, error: "Child name is required." }

    const childId = `child-${Math.random().toString(36).substring(2, 11)}`
    const today = new Date().toISOString().split("T")[0]
    const pupil: FirestorePupil = {
      id: childId,
      name: name.trim(),
      class_level: classLevel,
      points: 0,
      streak_count: 0,
      last_active_date: today,
      badges_earned: [],
      parentId,
      synced_at: Date.now(),
    }

    try {
      await linkChildToParent(pupil)
      await refreshChildren()
      handleSelectChild(childId)
      return { ok: true, childId }
    } catch (error) {
      console.error("Failed to link child:", error)
      return { ok: false, error: "Could not link child profile." }
    }
  }

  const selectedChild = children.find(c => c.id === selectedChildId) || null

  return {
    children,
    loading,
    selectedChild,
    selectedChildId,
    handleSelectChild,
    handleLinkChild,
    canLinkMore: children.length < MAX_PARENT_CHILDREN,
  }
}
