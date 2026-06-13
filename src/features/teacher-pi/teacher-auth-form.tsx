import React from "react"
import { Lock } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"

type TeacherAuthFormProps = {
  authTab: "login" | "register"
  authEmail: string
  authPassword: string
  authFullName: string
  authRole: "teacher" | "pupil"
  authError: string
  onTabChange: (tab: "login" | "register") => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onRoleChange: (value: "teacher" | "pupil") => void
  onSubmit: (e: React.FormEvent) => void
}

export const TeacherAuthForm = ({
  authTab,
  authEmail,
  authPassword,
  authFullName,
  authRole,
  authError,
  onTabChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onRoleChange,
  onSubmit,
}: TeacherAuthFormProps) => (
  <GlassCard className="max-w-md mx-auto p-8 shadow-2xl relative z-20 mt-8 mb-12">
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg mx-auto mb-3">
        <Lock className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-xl font-black text-white uppercase tracking-tight">Teacher Portal Login</h2>
      <p className="text-xs text-indigo-400 mt-1 uppercase font-semibold tracking-widest">
        Authenticate fɔh access local lessons & metrics
      </p>
    </div>

    <div className="grid grid-cols-2 bg-[#05060f] p-1.5 rounded-2xl border border-indigo-950 mb-6 font-semibold">
      <button
        type="button"
        onClick={() => onTabChange("login")}
        className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
          authTab === "login" ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onTabChange("register")}
        className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
          authTab === "register" ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Create Account
      </button>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      {authTab === "register" && (
        <div>
          <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Full Name</label>
          <input
            required
            type="text"
            value={authFullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="e.g. Mr. Amadu Kamara"
            className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none"
          />
        </div>
      )}

      <div>
        <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Email Address</label>
        <input
          required
          type="email"
          value={authEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="teacher@salone-stars.com"
          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/40 focus:border-indigo-500 transition outline-none"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Password</label>
        <input
          required
          type="password"
          value={authPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/40 focus:border-indigo-500 transition outline-none"
        />
      </div>

      {authTab === "register" && (
        <div>
          <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Workspace Role</label>
          <select
            value={authRole}
            onChange={(e) => onRoleChange(e.target.value as "teacher" | "pupil")}
            className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
          >
            <option value="teacher">Classroom Teacher</option>
            <option value="pupil">School Pupil</option>
          </select>
        </div>
      )}

      {authError && (
        <p className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-900 p-2.5 rounded-xl font-bold leading-tight">
          {authError}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition shadow-lg cursor-pointer"
      >
        {authTab === "login" ? "Sign In to Stars Academy" : "Register and Open"}
      </button>
    </form>
  </GlassCard>
)
