import { Cpu } from "lucide-react"

type PiStatusCardProps = {
  questCount: number
  studentCount: number
}

export const PiStatusCard = ({ questCount, studentCount }: PiStatusCardProps) => (
  <div
    id="pi-hardware-card"
    className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-4 flex items-center space-x-2">
      <Cpu className="h-4 w-4 text-indigo-400" />
      <span>Local Server Status (Teacher Pi)</span>
    </h3>

    <p className="text-xs text-indigo-300 mb-6 leading-relaxed">
      This Raspberry Pi operates without cellular internet. It acts as an ad-hoc local classroom Wi-Fi transmitter to
      cache and aggregate pupil grades.
    </p>

    <div className="space-y-3">
      <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">CPU Capacity</span>
        <span className="text-xs font-black text-emerald-400 font-mono">24.5% Active</span>
      </div>
      <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Operating Temp</span>
        <span className="text-xs font-black text-amber-405 font-mono">41.8 °C</span>
      </div>
      <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Cached Quests Pool</span>
        <span className="text-xs font-black text-blue-400 font-mono">{questCount} Active</span>
      </div>
      <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Mesh Connections</span>
        <span className="text-xs font-black text-purple-400 font-mono">{studentCount} Students</span>
      </div>
    </div>
  </div>
)
