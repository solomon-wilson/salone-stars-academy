import { Activity, Award, Calendar, Star, Wifi, WifiOff, CheckCircle2 } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { PARENT_KRIO } from "../../constants/parent"
import type { MergedPupilState } from "../../lib/pupil-state-merge"
import type { WeeklyEngagement } from "../../lib/parent-insights"

type ProgressDigestProps = {
  merged: MergedPupilState | null
  subjectsThisWeek: string[]
  weakSubjects: string[]
  weeklyEngagement: WeeklyEngagement | null
  dailyQuestCompleted: boolean
}

export const ProgressDigest = ({
  merged,
  subjectsThisWeek,
  weakSubjects,
  weeklyEngagement,
  dailyQuestCompleted,
}: ProgressDigestProps) => {
  if (!merged) {
    return (
      <GlassCard className="p-6">
        <p className="text-xs text-indigo-300">Link a child profile to see their progress digest.</p>
      </GlassCard>
    )
  }

  const syncLabel = merged.pendingSync
    ? PARENT_KRIO.syncPending
    : merged.syncStale
      ? PARENT_KRIO.syncStale
      : PARENT_KRIO.syncOk

  const SyncIcon = merged.pendingSync || merged.syncStale ? WifiOff : Wifi

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase text-white tracking-wide">Progress Digest</h3>
          <p className="text-[10px] text-indigo-400 mt-1">{PARENT_KRIO.digestTitle}</p>
        </div>
        <span
          className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 rounded-lg border ${
            merged.pendingSync || merged.syncStale
              ? "bg-amber-950/30 border-amber-800/50 text-amber-300"
              : "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
          }`}
        >
          <SyncIcon className="h-3 w-3" aria-hidden="true" />
          {syncLabel}
        </span>
      </div>

      {dailyQuestCompleted && (
        <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{PARENT_KRIO.celebration}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-xl font-black text-white">{merged.streak_count} days</p>
          <p className="text-[9px] text-indigo-500 mt-0.5">{PARENT_KRIO.streak}</p>
        </div>
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-xl font-black text-white">{merged.pointsThisWeek}</p>
          <p className="text-[9px] text-indigo-500 mt-0.5">{PARENT_KRIO.starsWeek}</p>
        </div>
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-wider">Stars</span>
          </div>
          <p className="text-xl font-black text-white">{merged.points}</p>
          <p className="text-[9px] text-indigo-500 mt-0.5">{PARENT_KRIO.starsTotal}</p>
        </div>
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-indigo-400 mb-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-wider">Last Active</span>
          </div>
          <p className="text-sm font-bold text-white">{merged.last_active_date || "Not yet"}</p>
          <p className="text-[9px] text-indigo-500 mt-0.5">{PARENT_KRIO.lastActive}</p>
        </div>
      </div>

      {weeklyEngagement && (
        <div className="bg-[#05060f] border border-indigo-900/40 rounded-xl p-3">
          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider mb-1">
            Weekly Engagement
          </p>
          <p className="text-lg font-black text-white">{weeklyEngagement.label}</p>
          <p className="text-[9px] text-indigo-500 mt-0.5">{PARENT_KRIO.weeklyEngagement}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-wider">
          {PARENT_KRIO.subjects}
        </p>
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

      {weakSubjects.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase text-amber-400 mb-2 tracking-wider">
            Weak Areas
          </p>
          <div className="flex flex-wrap gap-2">
            {weakSubjects.map(subject => (
              <span
                key={subject}
                className="text-[10px] bg-amber-950/40 border border-amber-800/50 text-amber-200 px-2.5 py-1 rounded-lg font-semibold"
              >
                {subject} — {PARENT_KRIO.weakAreas}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-wider">
          {PARENT_KRIO.badges}
        </p>
        {merged.badges_earned.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {merged.badges_earned.map(badge => (
              <span
                key={badge}
                className="text-[10px] bg-purple-950/40 border border-purple-800/50 text-purple-200 px-2.5 py-1 rounded-lg font-semibold"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-indigo-400">No badges yet — keep practicing!</p>
        )}
      </div>

      <p className="text-[10px] text-indigo-500">{PARENT_KRIO.wifiHint}</p>
    </GlassCard>
  )
}
