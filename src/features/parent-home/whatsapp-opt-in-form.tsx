import { MessageCircle } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"

type WhatsappOptInFormProps = {
  phone: string
  optIn: boolean
  saving: boolean
  onPhoneChange: (value: string) => void
  onOptInChange: (value: boolean) => void
  onSave: () => void
}

export const WhatsappOptInForm = ({
  phone,
  optIn,
  saving,
  onPhoneChange,
  onOptInChange,
  onSave,
}: WhatsappOptInFormProps) => (
  <GlassCard className="p-6 space-y-4">
    <div className="flex items-center gap-2">
      <MessageCircle className="h-5 w-5 text-emerald-400" aria-hidden="true" />
      <h3 className="text-sm font-black uppercase text-white tracking-wide">Weekly WhatsApp Digest</h3>
    </div>
    <p className="text-[11px] text-indigo-300 leading-relaxed">
      Get a short weekly progress summary on WhatsApp — streak, subjects, and weak areas. No daily spam.
    </p>
    <label className="flex items-center gap-2 text-xs text-indigo-200 cursor-pointer">
      <input
        type="checkbox"
        checked={optIn}
        onChange={(e) => onOptInChange(e.target.checked)}
        className="rounded border-indigo-700 bg-[#05060f] text-brand-primary focus:ring-indigo-500"
      />
      Send me weekly digest on WhatsApp
    </label>
    <input
      type="tel"
      value={phone}
      onChange={(e) => onPhoneChange(e.target.value.slice(0, 20))}
      disabled={!optIn}
      placeholder="+232 XX XXX XXXX"
      aria-label="WhatsApp phone number"
      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none disabled:opacity-50"
    />
    <button
      type="button"
      onClick={onSave}
      disabled={saving || (optIn && !phone.trim())}
      className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
    >
      {saving ? "Saving..." : "Save WhatsApp Preferences"}
    </button>
    <p className="text-[10px] text-indigo-500">
      Delivery requires Phase 7 notification service. Preferences are saved now for when it launches.
    </p>
  </GlassCard>
)
