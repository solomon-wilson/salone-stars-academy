import { RefreshCw, Sparkles } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { PARENT_KRIO } from "../../constants/parent"

type WeeklyTopicFormProps = {
  topics: string
  isPremium: boolean
  saving: boolean
  generating: boolean
  generatedTitle: string | null
  onTopicsChange: (value: string) => void
  onSaveTopics: () => void
  onGenerateHomework: () => void
  onApproveHomework: () => void
}

export const WeeklyTopicForm = ({
  topics,
  isPremium,
  saving,
  generating,
  generatedTitle,
  onTopicsChange,
  onSaveTopics,
  onGenerateHomework,
  onApproveHomework,
}: WeeklyTopicFormProps) => (
  <GlassCard className="p-6 space-y-4">
    <div>
      <h3 className="text-sm font-black uppercase text-white tracking-wide">Weekly School Topics</h3>
      <p className="text-[10px] text-indigo-400 mt-1">{PARENT_KRIO.weeklyTopic}</p>
    </div>

    <textarea
      value={topics}
      onChange={(e) => onTopicsChange(e.target.value.slice(0, 500))}
      disabled={!isPremium}
      placeholder="e.g. Fractions, water cycle, Krio spelling..."
      aria-label="Weekly school topics"
      rows={3}
      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none disabled:opacity-50"
    />
    <p className="text-[10px] text-indigo-500 text-right">{topics.length}/500</p>

    <div className="flex flex-col sm:flex-row gap-2">
      <button
        type="button"
        onClick={onSaveTopics}
        disabled={!isPremium || saving || !topics.trim()}
        className="flex-1 bg-indigo-950/60 hover:bg-indigo-900/60 disabled:opacity-50 border border-indigo-800/50 text-indigo-200 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
      >
        {saving ? "Saving..." : "Save Weekly Note"}
      </button>
      <button
        type="button"
        onClick={onGenerateHomework}
        disabled={!isPremium || generating || !topics.trim()}
        className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
      >
        {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        <span>{generating ? "Generating..." : "AI Homework Draft"}</span>
      </button>
    </div>

    {generatedTitle && (
      <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-3">
        <p className="text-xs text-emerald-300 font-bold">Draft ready: {generatedTitle}</p>
        <button
          type="button"
          onClick={onApproveHomework}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl cursor-pointer transition"
        >
          Approve for Child
        </button>
      </div>
    )}

    {!isPremium && (
      <p className="text-[11px] text-indigo-400">Premium Individual plan unlocks weekly topic notes and AI homework.</p>
    )}
  </GlassCard>
)
