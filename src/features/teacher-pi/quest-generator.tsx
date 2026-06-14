import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { BookOpen, PenLine, RefreshCw, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { apiFetch } from "../../lib/api-client"
import type { Quest, Question } from "../../types"

type QuestGeneratorProps = {
  userId: string | undefined
  onPublishComplete: () => void
}

const SUBJECTS = ["Mathematics", "General Science", "Social Studies & Civics", "English Language"]
const CLASS_LEVELS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"]
const DIFFICULTIES = ["Easy", "Medium", "Hard"]

type Tab = "browse" | "author"

function emptyQuestion(): Question {
  return { questionText: "", options: ["", "", "", ""], correctOption: "", explanation: "", krioInstruction: "" }
}

export const QuestGenerator = ({ onPublishComplete }: QuestGeneratorProps) => {
  const [tab, setTab] = useState<Tab>("browse")

  // Browse state
  const [browseClass, setBrowseClass] = useState("Class 4")
  const [browseSubject, setBrowseSubject] = useState("")
  const [bankQuests, setBankQuests] = useState<Quest[]>([])
  const [loadingBank, setLoadingBank] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  // Author state
  const [authorTitle, setAuthorTitle] = useState("")
  const [authorSubject, setAuthorSubject] = useState("Mathematics")
  const [authorClass, setAuthorClass] = useState("Class 4")
  const [authorDifficulty, setAuthorDifficulty] = useState("Medium")
  const [authorPoints, setAuthorPoints] = useState(120)
  const [authorQuestions, setAuthorQuestions] = useState<Question[]>([emptyQuestion(), emptyQuestion()])
  const [authorError, setAuthorError] = useState<string | null>(null)
  const [authorSaving, setAuthorSaving] = useState(false)

  useEffect(() => {
    if (tab === "browse") fetchBank()
  }, [tab, browseClass, browseSubject])

  const fetchBank = async () => {
    setLoadingBank(true)
    try {
      const params = new URLSearchParams()
      params.set("class_level", browseClass)
      if (browseSubject) params.set("subject", browseSubject)
      const resp = await apiFetch(`/api/quests?${params}`)
      if (resp.ok) setBankQuests(await resp.json())
    } catch {
      /* silent */
    } finally {
      setLoadingBank(false)
    }
  }

  const handlePublishFromBank = async (quest: Quest) => {
    setPublishing(quest.id)
    try {
      const resp = await apiFetch("/api/teacher/publish-quest", {
        method: "POST",
        body: JSON.stringify({ ...quest, source: "generated" }),
      })
      if (resp.ok) {
        onPublishComplete()
        alert(`"${quest.title}" published to classroom!`)
      }
    } catch {
      alert("Failed to publish. Check server connection.")
    } finally {
      setPublishing(null)
    }
  }

  const updateQuestion = (idx: number, field: keyof Question, value: string | string[]) => {
    setAuthorQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setAuthorQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = value
      return { ...q, options: opts }
    }))
  }

  const handleAuthorPublish = async () => {
    setAuthorError(null)
    if (!authorTitle.trim()) return setAuthorError("Quest title is required.")
    const invalid = authorQuestions.find(q =>
      !q.questionText.trim() || q.options.some(o => !o.trim()) || !q.correctOption.trim() || !q.explanation.trim()
    )
    if (invalid) return setAuthorError("All question fields (including 4 options) must be filled.")

    setAuthorSaving(true)
    try {
      const quest: Partial<Quest> = {
        title: authorTitle.trim(),
        subject: authorSubject,
        class_level: authorClass,
        difficulty: authorDifficulty,
        points_award: authorPoints,
        questions: authorQuestions,
        source: "generated",
      }
      const resp = await apiFetch("/api/teacher/publish-quest", {
        method: "POST",
        body: JSON.stringify(quest),
      })
      if (resp.ok) {
        setAuthorTitle("")
        setAuthorQuestions([emptyQuestion(), emptyQuestion()])
        onPublishComplete()
        alert("Custom quest published to classroom!")
      } else {
        const err = await resp.json()
        setAuthorError(err.error || "Publish failed.")
      }
    } catch {
      setAuthorError("Network error. Check server connection.")
    } finally {
      setAuthorSaving(false)
    }
  }

  return (
    <div
      id="teacher-quest-generator"
      className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-base font-black uppercase text-white tracking-wide mb-1">
        Quest Manager
      </h3>
      <p className="text-xs text-indigo-300 mb-5">
        Browse the MBSSE question bank or author a custom quest for your classroom.
      </p>

      {/* Tab switcher */}
      <div className="flex space-x-2 mb-6">
        {(["browse", "author"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest cursor-pointer transition ${
              tab === t
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-900/50"
            }`}
          >
            {t === "browse" ? <BookOpen className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
            <span>{t === "browse" ? "Browse Bank" : "Create Custom"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "browse" ? (
          <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Class Level</label>
                <select
                  value={browseClass}
                  onChange={e => setBrowseClass(e.target.value)}
                  className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Subject</label>
                <select
                  value={browseSubject}
                  onChange={e => setBrowseSubject(e.target.value)}
                  className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {loadingBank ? (
              <div className="flex justify-center py-10 text-indigo-400">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {bankQuests.map(quest => (
                  <div key={quest.id} className="bg-[#05060f] border border-indigo-900/50 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white uppercase tracking-wide truncate">{quest.title}</p>
                        <p className="text-[10px] text-indigo-400 mt-0.5">{quest.subject} · {quest.difficulty} · +{quest.points_award}⭐</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <button
                          onClick={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-200 cursor-pointer"
                        >
                          {expandedId === quest.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handlePublishFromBank(quest)}
                          disabled={publishing === quest.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wide rounded-lg cursor-pointer transition"
                        >
                          {publishing === quest.id ? "..." : "Publish"}
                        </button>
                      </div>
                    </div>
                    {expandedId === quest.id && (
                      <div className="border-t border-indigo-900/50 px-4 pb-4 pt-3 space-y-2">
                        {quest.questions.map((q, i) => (
                          <div key={i} className="text-[11px] text-indigo-300 leading-relaxed">
                            <span className="font-bold text-white">Q{i + 1}:</span> {q.questionText}
                            <span className="ml-2 text-emerald-400 font-bold">→ {q.correctOption}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {bankQuests.length === 0 && (
                  <p className="text-center text-indigo-500 text-xs py-8">No quests found for this filter.</p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="author" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Quest metadata */}
            <div>
              <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Quest Title</label>
              <input
                value={authorTitle}
                onChange={e => setAuthorTitle(e.target.value)}
                placeholder="e.g. Fractions at Bonthe Market"
                className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Subject", value: authorSubject, setter: setAuthorSubject, options: SUBJECTS },
                { label: "Class", value: authorClass, setter: setAuthorClass, options: CLASS_LEVELS },
                { label: "Difficulty", value: authorDifficulty, setter: setAuthorDifficulty, options: DIFFICULTIES },
              ].map(({ label, value, setter, options }) => (
                <div key={label}>
                  <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">{label}</label>
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-2 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Points</label>
                <input
                  type="number"
                  value={authorPoints}
                  onChange={e => setAuthorPoints(Number(e.target.value))}
                  min={10}
                  max={500}
                  className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-2 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {authorQuestions.map((q, qi) => (
                <div key={qi} className="bg-[#05060f] border border-indigo-900/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Question {qi + 1}</span>
                    {authorQuestions.length > 1 && (
                      <button
                        onClick={() => setAuthorQuestions(prev => prev.filter((_, i) => i !== qi))}
                        className="text-rose-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={q.questionText}
                    onChange={e => updateQuestion(qi, "questionText", e.target.value)}
                    placeholder="Question text..."
                    rows={2}
                    className="w-full bg-[#0a0c1e] border border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="bg-[#0a0c1e] border border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-500 mb-1 tracking-wider">Correct Answer</label>
                      <input
                        value={q.correctOption}
                        onChange={e => updateQuestion(qi, "correctOption", e.target.value)}
                        placeholder="Must match one option exactly"
                        className="w-full bg-[#0a0c1e] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Krio Instruction</label>
                      <input
                        value={q.krioInstruction}
                        onChange={e => updateQuestion(qi, "krioInstruction", e.target.value)}
                        placeholder="Krio guidance phrase..."
                        className="w-full bg-[#0a0c1e] border border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Explanation</label>
                    <textarea
                      value={q.explanation}
                      onChange={e => updateQuestion(qi, "explanation", e.target.value)}
                      placeholder="Why is this the correct answer?"
                      rows={2}
                      className="w-full bg-[#0a0c1e] border border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {authorQuestions.length < 4 && (
              <button
                onClick={() => setAuthorQuestions(prev => [...prev, emptyQuestion()])}
                className="flex items-center space-x-1.5 text-[10px] text-indigo-400 hover:text-indigo-200 font-bold uppercase tracking-widest cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            )}

            {authorError && (
              <div className="p-3 bg-rose-950/30 border border-rose-800 text-rose-400 rounded-xl text-xs font-bold">
                {authorError}
              </div>
            )}

            <button
              onClick={handleAuthorPublish}
              disabled={authorSaving}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest transition shadow-lg cursor-pointer"
            >
              {authorSaving ? "Publishing..." : "Publish Custom Quest to Classroom"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
