import { Award, Check } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import type { PupilProfile } from "../../types"

const BADGES = [
  { id: "Cotton Tree Scholar", emoji: "🏅", subtitle: "Mastered History & Civics units", unlocked: "border-indigo-500/30" },
  { id: "Gola Forest Guardian", emoji: "🌱", subtitle: "Rainforest protection path", unlocked: "border-emerald-500/30" },
  { id: "Bintumani Climber", emoji: "⛰️", subtitle: "Peak performance streak", unlocked: "border-orange-500/30" },
] as const

type BadgesCabinetProps = {
  profile: PupilProfile
}

export const BadgesCabinet = ({ profile }: BadgesCabinetProps) => (
  <GlassCard id="pupils-badges-box" className="p-6 shadow-2xl">
    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-4 flex items-center space-x-2">
      <Award className="h-4 w-4 text-indigo-400" />
      <span>Unlocked Cabinet (Pupil Pride)</span>
    </h4>
    <div className="space-y-3">
      {BADGES.map(badge => {
        const earned = profile.badges_earned.includes(badge.id)
        return (
          <div
            key={badge.id}
            className={`p-3 rounded-2xl border flex items-center space-x-3 transition ${
              earned
                ? `bg-slate-900/80 ${badge.unlocked} text-slate-200`
                : "bg-[#05060f]/60 border-indigo-950/45 text-slate-500 grayscale opacity-40"
            }`}
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-xl">
              {badge.emoji}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase leading-tight">{badge.id}</p>
              <p className="text-[10px] font-bold text-indigo-400">{badge.subtitle}</p>
            </div>
            {earned && <Check className="h-4 w-4 text-emerald-400" />}
          </div>
        )
      })}
    </div>
  </GlassCard>
)
