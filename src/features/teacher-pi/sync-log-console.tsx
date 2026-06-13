import { Activity } from "lucide-react"
import type { SyncLog } from "../../types"

type SyncLogConsoleProps = {
  logs: SyncLog[]
}

export const SyncLogConsole = ({ logs }: SyncLogConsoleProps) => (
  <div
    id="sync-console-box"
    className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl"
  >
    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-3 flex items-center space-x-2">
      <Activity className="h-4 w-4 text-emerald-400" />
      <span>Live Packet Merge Console</span>
    </h3>
    <p className="text-[10px] text-indigo-400 mb-4 font-sans leading-relaxed">
      Real-time LWW (Last-Write-Wins) sync log showing incoming client IndexedDB transactions.
    </p>

    <div className="bg-[#05060f] rounded-2xl p-4.5 border border-indigo-900/40 font-mono text-[10px] text-emerald-400 space-y-2 h-[220px] overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="border-b border-indigo-950/50 pb-2 last:border-0 leading-tight">
          <div className="flex items-center justify-between text-indigo-400">
            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="text-emerald-450 font-black tracking-widest text-[9px] uppercase">MERGE SUCCESS</span>
          </div>
          <p className="text-slate-100 my-0.5 font-bold uppercase text-[9px]">Pupil: {log.pupil_name}</p>
          <p className="text-[9px] text-indigo-403">
            Event: {log.event_type} (+{log.delta_points}⭐ Stars synced)
          </p>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center text-slate-600 py-10 font-mono text-[11px]">
          No incoming transactions in this session yet.
        </div>
      )}
    </div>
  </div>
)
