import React from "react"
import { Heart } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"

type ParentAuthFormProps = {
  authTab: "login" | "register"
  authEmail: string
  authPassword: string
  authFullName: string
  authError: string
  onTabChange: (tab: "login" | "register") => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const ParentAuthForm = ({
  authTab,
  authEmail,
  authPassword,
  authFullName,
  authError,
  onTabChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onSubmit,
}: ParentAuthFormProps) => (
  <GlassCard className="max-w-md mx-auto p-8 shadow-2xl relative z-20 mt-8 mb-12">
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg mx-auto mb-3">
        <Heart className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-xl font-black text-white uppercase tracking-tight">Parent Home</h2>
      <p className="text-xs text-indigo-400 mt-1 uppercase font-semibold tracking-widest">
        Help your child practice — no tutoring time needed
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
            placeholder="e.g. Amie Koroma"
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
          placeholder="parent@salone-stars.com"
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

      {authError && (
        <p className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-900 p-2.5 rounded-xl font-bold leading-tight">
          {authError}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-brand-primary hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition shadow-lg cursor-pointer"
      >
        {authTab === "login" ? "Sign In to Parent Home" : "Register Parent Account"}
      </button>
    </form>
  </GlassCard>
)
