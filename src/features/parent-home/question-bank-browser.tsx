import { useState, useEffect, useCallback } from "react"
import { RefreshCw, BookOpen, CheckSquare, Square, Package } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { apiFetch } from "../../lib/api-client"
import type { Quest } from "../../types"

type QuestionBankBrowserProps = {
  childClassLevel: string
  isPremium: boolean
  onPublishPack: (selectedIds: string[], title: string) => Promise<void>
  onUpgrade: () => void
}

const SUBJECTS = ["All", "Mathematics", "General Science", "Social Studies & Civics", "English Language"]

export const QuestionBankBrowser = ({
  childClassLevel,
  isPremium,
  onPublishPack,
  onUpgrade,
}: QuestionBankBrowserProps) => {
  const [subjectFilter, setSubjectFilter] = useState("All")
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)

  const fetchQuests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ class_level: childClassLevel })
      if (subjectFilter !== "All") params.set("subject", subjectFilter)
      const resp = await apiFetch(`/api/quests?${params}`)
      if (resp.ok) setQuests(await resp.json())
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [childClassLevel, subjectFilter])

  useEffect(() => {
    fetchQuests()
  }, [fetchQuests])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      }
      return next
    })
  }

  const handlePublish = async () => {
    if (selectedIds.size === 0) return
    const firstTitle = quests.find(q => selectedIds.has(q.id))?.title || "Practice Pack"
    const packTitle = selectedIds.size === 1
      ? `Practice: ${firstTitle}`
      : `${childClassLevel} Practice Pack (${selectedIds.size} quests)`

    setPublishing(true)
    try {
      await onPublishPack(Array.from(selectedIds), packTitle)
      setSelectedIds(new Set())
    } finally {
      setPublishing(false)
    }
  }

  if (!isPremium) {
    return (
      <GlassCard className="p-6 text-center space-y-3">
        <BookOpen className="h-8 w-8 text-indigo-500 mx-auto" />
        <p className="text-sm font-black text-white uppercase tracking-wide">Question Bank</p>
        <p className="text-xs text-indigo-400 leading-relaxed">
          Upgrade to Individual plan to browse and publish practice packs from the MBSSE question bank for your child.
        </p>
        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
        >
          Upgrade to Unlock
        </button>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase text-white tracking-wide">MBSSE Question Bank</h3>
        <p className="text-[10px] text-indigo-400 mt-1">
          Showing {childClassLevel} quests. Select up to 5 to create a practice pack for your child.
        </p>
      </div>

      {/* Subject filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => { setSubjectFilter(s); setSelectedIds(new Set()) }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition ${
              subjectFilter === s
                ? "bg-indigo-600 text-white"
                : "bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-900/50"
            }`}
          >
            {s === "All" ? "All" : s.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Quest list */}
      {loading ? (
        <div className="flex justify-center py-8 text-indigo-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {quests.map(quest => {
            const selected = selectedIds.has(quest.id)
            return (
              <button
                key={quest.id}
                onClick={() => toggleSelect(quest.id)}
                disabled={!selected && selectedIds.size >= 5}
                className={`w-full flex items-start space-x-3 p-3 rounded-2xl border text-left cursor-pointer transition ${
                  selected
                    ? "bg-indigo-900/40 border-indigo-500/60"
                    : "bg-[#05060f] border-indigo-900/40 hover:border-indigo-700/60 disabled:opacity-40"
                }`}
              >
                <div className="mt-0.5 shrink-0 text-indigo-400">
                  {selected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white leading-tight">{quest.title}</p>
                  <p className="text-[10px] text-indigo-400 mt-0.5">
                    {quest.subject} · {quest.difficulty} · {quest.questions.length} questions · +{quest.points_award}⭐
                  </p>
                </div>
              </button>
            )
          })}
          {quests.length === 0 && (
            <p className="text-center text-indigo-500 text-xs py-6">No quests found for this filter.</p>
          )}
        </div>
      )}

      {/* Publish button */}
      {selectedIds.size > 0 && (
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
        >
          {publishing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Package className="h-4 w-4" />
          )}
          <span>
            {publishing ? "Publishing..." : `Publish Practice Pack (${selectedIds.size} quest${selectedIds.size > 1 ? "s" : ""})`}
          </span>
        </button>
      )}
      {selectedIds.size === 0 && quests.length > 0 && (
        <p className="text-[10px] text-indigo-500 text-center">Select quests above to create a practice pack.</p>
      )}
    </GlassCard>
  )
}
