import { Activity, Award, Calendar } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { PARENT_KRIO } from "../../constants/parent"
import type { FirestorePupil } from "../../firebaseDb"

type ProgressDigestProps = {
  child: FirestorePupil | null
  subjectsThisWeek: string[]
}

export const ProgressDigest = ({ child, subjectsThisWeek }: ProgressDigestProps) => {
  if (!child) {
    return (
      <GlassCard className="p-6">
        <p className="text-xs text-indigo-300">Link a child profile to see their progress digest.</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase text-white tracking-wide">Progress Digest</h3>
        <p className="text-[10px] text-indigo-400 mt-1">{PARENT_KRIO.digestTitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-xl font-black text-white">{child.streak_count} days</p>
        </div>
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Award className="h-3.5 w-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Stars</span>
          </div>
          <p className="text-xl font-black text-white">{child.points}</p>
        </div>
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3 col-span-2">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Last Active</span>
          </div>
          <p className="text-sm font-bold text-white">{child.last_active_date || "Not yet"}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-wider">Subjects Attempted</p>
        {subjectsThisWeek.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjectsThisWeek.map(subject => (
              <span
                key={subject}
                className="text-[10px] bg-indigo-950/60 border border-indigo-800/50 text-indigo-200 px-2.5 py-1 rounded-lg font-semibold"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-indigo-400">No completed quests yet this week.</p>
        )}
      </div>
    </GlassCard>
  )
}
