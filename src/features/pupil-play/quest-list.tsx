import { motion } from "motion/react"
import { RefreshCw, Book, Play, CheckCircle2, Sparkles } from "lucide-react"
import type { Quest, PupilProfile } from "../../types"

type QuestListProps = {
  quests: Quest[]
  profile: PupilProfile
  completedQuests: Record<string, boolean>
  loadingQuests: boolean
  onStartQuest: (quest: Quest) => void
}

export const QuestList = ({ quests, profile, completedQuests, loadingQuests, onStartQuest }: QuestListProps) => {
  const filtered = quests.filter((q) => q.class_level === profile.class_level)

  return (
    <motion.div
      key="quest-list"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/50 border border-indigo-900/50 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-xl font-black text-white uppercase tracking-wide">🎒 Learning Paths & Quests</h2>
        <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
          Choose your subject. All quests are fully aligned with di Sierra Leone{" "}
          <strong>Ministry of Basic and Senior Secondary Education (MBSSE)</strong> national primary guidelines,
          featuring localized scenarios and Krio oral guidance.
        </p>
      </div>

      {loadingQuests ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs text-indigo-455 font-mono">Loading classroom quest modules from Hotspot...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((quest) => {
            const isCompleted = completedQuests[quest.id]
            return (
              <div
                key={quest.id}
                className={`bg-[#0f1233]/80 backdrop-blur-md border rounded-[28px] p-6 hover:bg-[#1a1f4d] transition duration-150 flex flex-col justify-between hover:shadow-2xl relative overflow-hidden ${
                  isCompleted
                    ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "border-indigo-900/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        quest.subject === "Mathematics"
                          ? "bg-red-500/10 text-red-700 border border-red-500/20"
                          : quest.subject === "General Science"
                          ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {quest.subject}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                        Level: {quest.difficulty}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white mb-2 leading-tight uppercase">{quest.title}</h3>
                  <p className="text-xs text-indigo-300 leading-normal mb-6">
                    {quest.questions.length} Practice Exercises aligning Class {quest.class_level}. Contains Krio
                    scaffolding.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-indigo-950">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-black text-yellow-500 font-mono">{quest.points_award} Stars Award</span>
                  </div>
                  <button
                    onClick={() => onStartQuest(quest)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer ${
                      isCompleted
                        ? "bg-[#05060f] hover:bg-[#0f1233] text-indigo-400 border border-indigo-900/50"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-950/20"
                    }`}
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{isCompleted ? "Redo" : "Learn Now"}</span>
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 bg-[#0f1233]/40 rounded-[28px] p-10 border border-dashed border-indigo-900/60 text-center">
              <Book className="h-10 w-10 text-indigo-900 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-bold uppercase tracking-wide">
                No active quests for {profile.class_level} yet.
              </p>
              <p className="text-xs text-indigo-450 mt-2 max-w-sm mx-auto leading-relaxed">
                Sync with di Teacher Pi or choose "🎓 Teacher Pi" tab above fɔh generate and publish fresh custom
                quests using Gemini AI!
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
