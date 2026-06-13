import { motion } from "motion/react"
import { RefreshCw, Sparkles, Zap } from "lucide-react"

type PricingModalProps = {
  upgradingLoading: boolean
  onClose: () => void
  onUpgrade: (plan: "individual" | "team") => void
}

export const PricingModal = ({ upgradingLoading, onClose, onUpgrade }: PricingModalProps) => (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-dark max-w-4xl w-full p-8 text-slate-100 shadow-3xl space-y-6 my-8"
    >
      <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50">
        <div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Flexible Subscriptions
          </span>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1.5">
            Salone Stars Academy Plans
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close pricing modal"
          className="text-indigo-400 hover:text-indigo-300 font-bold w-10 h-10 rounded-full bg-indigo-950 flex items-center justify-center cursor-pointer transition"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-indigo-300 max-w-2xl leading-relaxed">
        Equip your school or private classroom with localized lesson plans, AI-supported quest generators, and cross-district synced leaderboards.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="glass-card-dark p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Free Explorer</h4>
            <div className="flex items-baseline space-x-1 mt-3">
              <span className="text-3xl font-black text-white">$0</span>
              <span className="text-xs text-indigo-400 font-semibold">/ month</span>
            </div>
            <p className="text-[11px] text-indigo-300 mt-3 leading-relaxed">
              Access preset MBSSE quizzes and basic local device stats caching fɔh student offline gameplay.
            </p>
          </div>
          <span className="block w-full text-center bg-indigo-950/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider py-3 rounded-xl border border-indigo-900/30 mt-8">
            Active Free Tier
          </span>
        </div>

        <div className="glass-card-dark p-6 flex flex-col justify-between border-2 border-indigo-500 shadow-xl relative">
          <div className="absolute top-0 right-0 bg-indigo-500 text-slate-950 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
            Popular fɔh Private Teachers
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-indigo-300 tracking-widest">Individual Lesson</h4>
            <div className="flex items-baseline space-x-1 mt-3 text-white">
              <span className="text-3xl font-black">$19.99</span>
              <span className="text-xs text-indigo-300 font-semibold">/ month</span>
            </div>
            <p className="text-[11px] text-indigo-300 mt-3 leading-relaxed">
              Perfect for dedicated teachers with custom curriculum additions aligned with MBSSE goals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpgrade("individual")}
            disabled={upgradingLoading}
            className="w-full bg-brand-primary hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition flex items-center justify-center space-x-2 mt-8"
          >
            {upgradingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4 text-yellow-400" /><span>Upgrade Individual</span></>}
          </button>
        </div>

        <div className="glass-card-dark p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-purple-400 tracking-widest">Team Enterprise</h4>
            <div className="flex items-baseline space-x-1 mt-3">
              <span className="text-3xl font-black text-white">$99.99</span>
              <span className="text-xs text-indigo-400 font-semibold">/ month</span>
            </div>
            <p className="text-[11px] text-indigo-300 mt-3 leading-relaxed">
              Deploy across full institutions with up to 25 teacher licenses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpgrade("team")}
            disabled={upgradingLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition flex items-center justify-center space-x-2 mt-8"
          >
            {upgradingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 text-yellow-400" /><span>Activate Team License</span></>}
          </button>
        </div>
      </div>

      <div className="bg-[#0f1233]/40 border border-[#1e1b4b] rounded-2xl p-4 text-xs text-indigo-300 font-medium">
        Clicking upgrade opens a secure Stripe checkout. Your plan updates automatically after payment.
      </div>
    </motion.div>
  </div>
)
