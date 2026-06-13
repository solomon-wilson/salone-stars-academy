import { RefreshCw, UploadCloud } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"

type SyncConsoleProps = {
  unsyncedPoints: number
  syncingLoading: boolean
  syncSuccess: boolean | null
  syncMessage: string
  onSync: () => void
}

export const SyncConsole = ({
  unsyncedPoints,
  syncingLoading,
  syncSuccess,
  syncMessage,
  onSync,
}: SyncConsoleProps) => (
  <GlassCard id="classroom-sync-box" className="p-6 shadow-2xl relative overflow-hidden">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs font-black uppercase text-indigo-400 tracking-[0.15em] flex items-center space-x-2">
        <UploadCloud className="h-4 w-4 text-indigo-400" />
        <span>Ad-Hoc Hotspot Sync</span>
      </h4>
      {unsyncedPoints > 0 ? (
        <span className="animate-pulse bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
          +{unsyncedPoints}⭐ Unsaved
        </span>
      ) : (
        <span className="bg-[#05060f] text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-950/40">
          Sync is Current
        </span>
      )}
    </div>

    <p className="text-xs text-indigo-300 mb-4 leading-relaxed">
      Every star and badge are written to di safe local database. Squeeze sync fɔh publish to di Teacher Pi hotspot and retrieve custom quizzes!
    </p>

    {syncingLoading ? (
      <div className="bg-[#05060f] p-3.5 rounded-2xl border border-indigo-900/50 font-mono text-xs space-y-2 text-indigo-300">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
          <span className="font-bold text-emerald-400">Classroom Syncer active...</span>
        </div>
        <p className="text-[11px] text-amber-300 border-l-2 border-amber-500 pl-2 leading-tight">{syncMessage}</p>
      </div>
    ) : (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSync}
          aria-label="Sync data to Teacher Pi"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest transition shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Sync Data to Teacher Pi</span>
        </button>
        {syncSuccess === true && (
          <p className="text-[11px] text-emerald-400 font-bold text-center bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/50">
            {syncMessage}
          </p>
        )}
        {syncSuccess === false && (
          <p className="text-[11px] text-rose-400 font-bold text-center bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/50">
            {syncMessage}
          </p>
        )}
      </div>
    )}
  </GlassCard>
)
