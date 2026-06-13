import { TrendingUp } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { TUTOR_SESSION_SLL_ANCHOR } from "../../constants/parent"

type ValueSummaryCardProps = {
  daysPracticed: number
  questsCompleted: number
  isPremium: boolean
}

export const ValueSummaryCard = ({
  daysPracticed,
  questsCompleted,
  isPremium,
}: ValueSummaryCardProps) => (
  <GlassCard className="p-6 space-y-3 border border-yellow-500/20">
    <div className="flex items-center gap-2">
      <TrendingUp className="h-5 w-5 text-yellow-400" aria-hidden="true" />
      <h3 className="text-sm font-black uppercase text-white tracking-wide">Value Summary</h3>
    </div>
    <p className="text-[11px] text-indigo-300 leading-relaxed">
      Private tutors often cost Le {TUTOR_SESSION_SLL_ANCHOR.toLocaleString()}+ per session with no-shows.
      SSA gives daily MBSSE-aligned practice your child can do alone — offline when needed.
    </p>
    {isPremium && (daysPracticed > 0 || questsCompleted > 0) && (
      <p className="text-xs text-emerald-300 font-semibold">
        This month: {daysPracticed} day{daysPracticed !== 1 ? "s" : ""} practiced · {questsCompleted} quest
        {questsCompleted !== 1 ? "s" : ""} completed
      </p>
    )}
    {!isPremium && (
      <p className="text-[11px] text-indigo-400">
        Upgrade to Individual to unlock daily topic-aligned homework and track monthly practice proof.
      </p>
    )}
  </GlassCard>
)
