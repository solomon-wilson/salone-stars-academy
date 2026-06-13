import { Sparkles, Flame, Shield, Plus } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import type { PupilProfile } from "../../types"

type PupilProfileCardProps = {
  profile: PupilProfile
  isEditingProfile: boolean
  editName: string
  editClass: string
  onEditNameChange: (value: string) => void
  onEditClassChange: (value: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onPurchaseStreakFreeze: () => void
}

export const PupilProfileCard = ({
  profile,
  isEditingProfile,
  editName,
  editClass,
  onEditNameChange,
  onEditClassChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPurchaseStreakFreeze,
}: PupilProfileCardProps) => (
  <GlassCard id="pupil-profile-card" className="p-6 shadow-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

    {isEditingProfile ? (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Edit Pupil Profile</h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-mono">Pupil Name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500"
            placeholder="e.g. Fatu Sesay"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-mono">Primary Level</label>
          <select
            value={editClass}
            onChange={(e) => onEditClassChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
          >
            {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"].map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={onSaveEdit}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded-xl text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-white tracking-wide">{profile.name}</h2>
              <span className="inline-block bg-[#05060f] text-indigo-400 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-900/30">
                {profile.class_level} Pupil
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartEdit}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest hover:underline cursor-pointer"
          >
            Change
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#0a0c21] p-4 rounded-2xl border border-indigo-950/40">
          <div>
            <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Stars Total</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-lg font-black text-white">{profile.points}</span>
            </div>
          </div>
          <div>
            <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Daily Streak</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              <span className="text-lg font-black text-white">{profile.streak_count} Days</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between bg-[#05060f]/60 border border-indigo-900/40 p-3.5 rounded-2xl">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-xs text-slate-100 font-bold uppercase tracking-wide">Streak protection</p>
              <p className="text-[9px] text-indigo-400 uppercase font-semibold">Keeps progress safe</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-indigo-300">{profile.streak_freezes} Active</span>
            <button
              type="button"
              onClick={onPurchaseStreakFreeze}
              className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center space-x-1 cursor-pointer"
              title="Cost: 50 stars"
            >
              <Plus className="h-3 w-3" />
              <span>Buy (50⭐)</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </GlassCard>
)
