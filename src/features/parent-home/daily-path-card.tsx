import { BookOpen, Lock, Play } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { PARENT_KRIO } from "../../constants/parent"
import { getSubjectColors } from "../../lib/subject-colors"
import type { Quest } from "../../types"

type DailyPathCardProps = {
  dailyQuest: Quest | null
  isPremium: boolean
  onStartPractice: () => void
  onUpgrade: () => void
}

export const DailyPathCard = ({
  dailyQuest,
  isPremium,
  onStartPractice,
  onUpgrade,
}: DailyPathCardProps) => (
  <GlassCard className="p-6 space-y-4 border-2 border-indigo-500/30">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black uppercase text-white tracking-wide">Daily Homework Path</h3>
        <p className="text-[10px] text-indigo-400 mt-1">{PARENT_KRIO.dailyPath}</p>
      </div>
      {!isPremium && (
        <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-lg font-black uppercase">
          Free tier
        </span>
      )}
    </div>

    {dailyQuest ? (
      <div className={`rounded-2xl p-4 border ${getSubjectColors(dailyQuest.subject).accent} bg-[#05060f]/80`}>
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen className="h-4 w-4 text-indigo-300" />
          <span className="text-[10px] font-black uppercase text-indigo-300">
            {dailyQuest.subject}
          </span>
        </div>
        <p className="text-sm font-bold text-white">{dailyQuest.title}</p>
        <p className="text-[11px] text-indigo-300 mt-1">{dailyQuest.class_level} · {dailyQuest.difficulty}</p>
      </div>
    ) : (
      <p className="text-xs text-indigo-300">No quests available for this class level yet.</p>
    )}

    {isPremium ? (
      <button
        type="button"
        onClick={onStartPractice}
        disabled={!dailyQuest}
        aria-label="Start child's practice"
        className="w-full flex items-center justify-center space-x-2 bg-brand-primary hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
      >
        <Play className="h-4 w-4" />
        <span>{PARENT_KRIO.startPractice}</span>
      </button>
    ) : (
      <div className="space-y-2">
        <p className="text-[11px] text-indigo-300 leading-relaxed">
          Upgrade to Individual ($19.99/mo) for topic-aligned daily homework and AI quest drafts.
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
        >
          <Lock className="h-4 w-4" />
          <span>{PARENT_KRIO.upgradeCta}</span>
        </button>
      </div>
    )}
  </GlassCard>
)
