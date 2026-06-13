import { Link2 } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"

type SchoolInviteLinkerProps = {
  inviteCode: string
  linking: boolean
  onInviteCodeChange: (value: string) => void
  onLinkByInvite: () => void
}

export const SchoolInviteLinker = ({
  inviteCode,
  linking,
  onInviteCodeChange,
  onLinkByInvite,
}: SchoolInviteLinkerProps) => (
  <GlassCard className="p-6 space-y-4">
    <div className="flex items-center gap-2">
      <Link2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
      <h3 className="text-sm font-black uppercase text-white tracking-wide">School Invite Code</h3>
    </div>
    <p className="text-[11px] text-indigo-300 leading-relaxed">
      If your child uses SSA at school, ask the teacher for an invite code to link their classroom profile to your home account.
    </p>
    <input
      type="text"
      value={inviteCode}
      onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase().slice(0, 8))}
      placeholder="e.g. SSA4X2K9"
      aria-label="School invite code"
      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none font-mono tracking-widest"
    />
    <button
      type="button"
      onClick={onLinkByInvite}
      disabled={linking || inviteCode.trim().length < 6}
      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
    >
      {linking ? "Linking..." : "Link School Child"}
    </button>
  </GlassCard>
)
