import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { RefreshCw, Sparkles, Info } from "lucide-react"
import { apiFetch } from "../../lib/api-client"
import { SIERRA_LEONE_FACTS } from "../../constants/facts"
import type { Quest } from "../../types"

type QuestGeneratorProps = {
  userId: string | undefined
  onPublishComplete: () => void
}

export const QuestGenerator = ({ userId, onPublishComplete }: QuestGeneratorProps) => {
  const [aiSubject, setAiSubject] = useState("General Science")
  const [aiClassLevel, setAiClassLevel] = useState("Class 4")
  const [aiTheme, setAiTheme] = useState("")
  const [generating, setGenerating] = useState(false)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (generating) {
      interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % SIERRA_LEONE_FACTS.length)
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [generating])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerationError(null)
    setGeneratedQuest(null)
    setCurrentFactIndex(0)
    try {
      const response = await apiFetch("/api/teacher/generate-quest", {
        method: "POST",
        body: JSON.stringify({ subject: aiSubject, class_level: aiClassLevel, customTopic: aiTheme }),
      })
      if (response.ok) {
        const data = await response.json()
        setGeneratedQuest(data)
      } else {
        const errData = await response.json()
        throw new Error(errData.error || "Server failed to invoke generative AI.")
      }
    } catch (e: any) {
      console.error(e)
      setGenerationError(e.message || "Failed to reach server-side Gemini generation engine.")
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!generatedQuest) return
    try {
      const response = await apiFetch("/api/teacher/publish-quest", {
        method: "POST",
        body: JSON.stringify({ ...generatedQuest, subject: aiSubject, class_level: aiClassLevel, teacherId: userId }),
      })
      if (response.ok) {
        alert("Quest Published successfully! Students will see it after they sync.")
        setGeneratedQuest(null)
        setAiTheme("")
        onPublishComplete()
      }
    } catch (e) {
      console.error("Failed to publish quest", e)
      alert("Hotspot synchronization error during publishing!")
    }
  }

  return (
    <div
      id="teacher-quest-generator"
      className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center space-x-2.5 mb-2">
        <div className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
          Gemini AI Integration
        </div>
        <h3 className="text-base font-black uppercase text-white tracking-wide">
          Create MBSSE Quest fɔh Sierra Leone Classes
        </h3>
      </div>
      <p className="text-xs text-indigo-300 leading-normal mb-6">
        Input Class level and a localized subject. Gemini AI will write two perfect custom educational questions,
        complete with spoken Krio translation summaries and logical answer explanation guides.
      </p>

      {/* Generation form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
            Curricular Subject
          </label>
          <select
            value={aiSubject}
            onChange={(e) => setAiSubject(e.target.value)}
            className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
          >
            <option value="Mathematics">Mathematics</option>
            <option value="General Science">General Science</option>
            <option value="Social Studies & Civics">Social Studies & Civics</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
            Primary Class Level
          </label>
          <select
            value={aiClassLevel}
            onChange={(e) => setAiClassLevel(e.target.value)}
            className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
          >
            {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"].map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
            Localized Topic Context
          </label>
          <input
            type="text"
            value={aiTheme}
            onChange={(e) => setAiTheme(e.target.value)}
            placeholder="e.g. Pygmy hippos, buying Palm Oil..."
            className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none"
          />
        </div>
      </div>

      {generating ? (
        <div className="bg-[#05060f] border border-indigo-900/50 p-6 rounded-2xl text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
          <div>
            <p className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider">
              Gemini Generative Engine crafting questions...
            </p>
            <p className="text-[10px] text-indigo-550 mt-1 uppercase font-bold tracking-widest">
              Applying MBSSE primary school syllabus guidelines
            </p>
          </div>
          <motion.div
            key={currentFactIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl text-left max-w-md mx-auto"
          >
            <div className="flex items-center space-x-1.5 text-indigo-405 text-[10px] font-black uppercase tracking-widest mb-1">
              <Info className="h-3.5 w-3.5" />
              <span>Curriculum Fact</span>
            </div>
            <span className="text-[11px] text-indigo-305 font-sans leading-relaxed">
              {SIERRA_LEONE_FACTS[currentFactIndex]}
            </span>
          </motion.div>
        </div>
      ) : (
        <div>
          <button
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest transition shadow-lg shadow-indigo-950/30 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>🔮 Generate Curricular Quest via Gemini AI</span>
          </button>
          {generationError && (
            <div className="mt-4 p-3.5 bg-rose-950/30 border border-rose-800 text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-wider">
              Error: {generationError}
            </div>
          )}
        </div>
      )}

      {/* Generated quest review panel */}
      {generatedQuest && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-[#05060f] p-5 rounded-2xl border border-indigo-500/30 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-widest">
                Generated {generatedQuest.subject} ({generatedQuest.difficulty})
              </span>
              <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wider">
                Review: {generatedQuest.title}
              </h4>
            </div>
            <span className="text-xs text-yellow-500 font-black">+{generatedQuest.points_award}⭐ Award</span>
          </div>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {generatedQuest.questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-[#0f1233]/40 p-4 rounded-2xl border border-indigo-950/50 space-y-2 text-xs"
              >
                <p className="font-extrabold text-slate-100 uppercase text-[11px] tracking-wide">
                  Q{idx + 1}: {q.questionText}
                </p>
                <p className="text-[11px] text-indigo-300">
                  <span className="text-emerald-400 font-bold uppercase tracking-wide">Correct Answer:</span>{" "}
                  {q.correctOption}
                </p>
                <p className="text-[11px] text-indigo-300 italic">"Krio: {q.krioInstruction}"</p>
                <p className="text-[10px] text-indigo-450 leading-relaxed">Explanation: {q.explanation}</p>
              </div>
            ))}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handlePublish}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-xl text-[11px] uppercase tracking-widest transition shadow cursor-pointer text-center"
            >
              Publish to Classroom Sync Server
            </button>
            <button
              onClick={() => setGeneratedQuest(null)}
              className="bg-[#0f1233] hover:bg-slate-900 border border-indigo-900/50 text-indigo-300 font-black py-3 px-5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer"
            >
              Discard
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
