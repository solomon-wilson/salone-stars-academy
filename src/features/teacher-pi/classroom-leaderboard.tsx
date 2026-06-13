import { Award, Sparkles } from "lucide-react"
import type { SyncedStudent } from "../../types"

type ClassroomLeaderboardProps = {
  syncedStudents: SyncedStudent[]
}

export const ClassroomLeaderboard = ({ syncedStudents }: ClassroomLeaderboardProps) => (
  <div className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl">
    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.15em] mb-6 flex items-center space-x-2">
      <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />
      <span>Interactive Classroom Leaderboard & Podium</span>
    </h3>

    {syncedStudents.length >= 3 && (
      <div className="flex items-end justify-between max-w-md mx-auto mb-8 border-b border-indigo-900/50 pb-2">
        {/* 2nd place */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 bg-indigo-500/10 border-2 border-slate-400 rounded-full flex items-center justify-center font-black text-white text-xs shadow-inner">
            {syncedStudents[1].name.charAt(0)}
          </div>
          <p className="text-[10px] text-slate-350 font-black uppercase mt-1.5 truncate max-w-[80px]">
            {syncedStudents[1].name}
          </p>
          <span className="text-[9.5px] font-mono text-indigo-400 font-bold">{syncedStudents[1].points}⭐</span>
          <div className="h-10 bg-[#0d0e2c] border-t border-slate-400/30 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-slate-400 text-xs">
            2nd
          </div>
        </div>

        {/* 1st place */}
        <div className="flex flex-col items-center flex-1 -mt-4">
          <div className="w-12 h-12 bg-yellow-500/20 border-2 border-yellow-400 rounded-full flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            {syncedStudents[0].name.charAt(0)}
          </div>
          <p className="text-xs text-yellow-400 font-black uppercase mt-1.5 truncate max-w-[90px]">
            {syncedStudents[0].name}
          </p>
          <span className="text-[10px] font-mono text-yellow-405 font-black">{syncedStudents[0].points}⭐</span>
          <div className="h-14 bg-gradient-to-t from-yellow-600/20 to-yellow-500/10 border-t-2 border-yellow-500 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-yellow-400 text-sm">
            1st
          </div>
        </div>

        {/* 3rd place */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 bg-amber-700/10 border-2 border-amber-600 rounded-full flex items-center justify-center font-black text-white text-xs shadow-inner">
            {syncedStudents[2].name.charAt(0)}
          </div>
          <p className="text-[10px] text-slate-355 font-black uppercase mt-1.5 truncate max-w-[80px]">
            {syncedStudents[2].name}
          </p>
          <span className="text-[9.5px] font-mono text-indigo-400 font-bold">{syncedStudents[2].points}⭐</span>
          <div className="h-8 bg-[#0d0e2c] border-t border-amber-600/30 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-amber-500 text-xs">
            3rd
          </div>
        </div>
      </div>
    )}

    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
      {syncedStudents.map((student, i) => (
        <div
          key={student.id}
          className="p-3.5 bg-[#05060f] border border-indigo-900/30 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs transition"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xs text-indigo-500 font-mono font-black w-4">#{i + 1}</span>
            <div>
              <p className="font-extrabold text-slate-100 uppercase text-[11px] tracking-wide">{student.name}</p>
              <p className="text-[9.5px] font-medium text-indigo-400">
                Class: {student.class_level} • Last Sync: {new Date(student.synced_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-1">
              {student.badges_earned.map((b) => (
                <div
                  key={b}
                  className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-[#05060f]"
                  title={b}
                >
                  <Award className="h-3 w-3 text-emerald-400" />
                </div>
              ))}
            </div>
            <span className="font-mono font-black text-yellow-500">{student.points}⭐ Stars</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)
