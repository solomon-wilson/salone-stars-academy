import { useState, useEffect } from "react"
import { Lock, RefreshCw, UploadCloud, BookOpen } from "lucide-react"
import { uploadCurriculum, getCurriculums } from "../../firebaseDb"
import type { Curriculum } from "../../types"

type CurriculumUploaderProps = {
  userId: string
  subscriptionPlan: string
  onUpgradeClick: () => void
}

export const CurriculumUploader = ({ userId, subscriptionPlan, onUpgradeClick }: CurriculumUploaderProps) => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [schoolName, setSchoolName] = useState("")
  const [currClassLevel, setCurrClassLevel] = useState("Class 1")
  const [alignedMbsseOutcome, setAlignedMbsseOutcome] = useState("")
  const [currTopicsRaw, setCurrTopicsRaw] = useState("")
  const [currDescription, setCurrDescription] = useState("")
  const [uploading, setUploading] = useState(false)

  const loadCurriculums = async () => {
    try {
      const data = await getCurriculums(userId)
      setCurriculums(data)
    } catch (e) {
      console.error("Failed to retrieve curriculums:", e)
    }
  }

  useEffect(() => {
    loadCurriculums()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolName || !alignedMbsseOutcome || !currTopicsRaw || !currDescription) {
      alert("All fields are required.")
      return
    }
    setUploading(true)
    try {
      const topics = currTopicsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      const curriculumId = `curr-${Math.random().toString(36).substring(2, 9)}`
      await uploadCurriculum({
        id: curriculumId,
        teacherId: userId,
        class_level: currClassLevel,
        schoolName,
        alignedMbsseOutcome,
        topics,
        description: currDescription,
        updatedAt: new Date().toISOString(),
      })
      alert("Curriculum aligned to MBSSE standards successfully uploaded to Google Firestore!")
      setSchoolName("")
      setAlignedMbsseOutcome("")
      setCurrTopicsRaw("")
      setCurrDescription("")
      loadCurriculums()
    } catch (err) {
      console.error("Firestore write failure:", err)
      alert("Could not persist curriculum on Google Server due to network bounds.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      id="mbsse-curriculum-uploader"
      className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center space-x-2.5 mb-2">
        <div className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
          School Syllabus Portal
        </div>
        <h3 className="text-base font-black uppercase text-white tracking-wide">Upload Custom School Curriculum</h3>
      </div>
      <p className="text-xs text-indigo-300 leading-normal mb-6">
        Align your school (government or private) specific weekly curriculum guidelines for Class 1–6 with di national
        MBSSE syllabus.
      </p>

      {subscriptionPlan === "free" ? (
        <div className="bg-slate-950/80 border border-indigo-900/40 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
          <Lock className="h-8 w-8 text-yellow-500 animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Custom Syllabus is Locked</h4>
          <p className="text-[11px] text-indigo-300 max-w-xs leading-normal">
            Connecting private school curriculums is restricted fɔh Individual and Team subscribers. Squeeze below fɔh
            unlock.
          </p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-650 hover:to-amber-700 text-slate-950 rounded-xl text-[10px] font-black tracking-widest uppercase transition-transform cursor-pointer"
          >
            🚀 Upgrade Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
                School Name
              </label>
              <input
                required
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Freetown Methodist School"
                className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-505 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
                Target Class Level
              </label>
              <select
                value={currClassLevel}
                onChange={(e) => setCurrClassLevel(e.target.value)}
                className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer outline-none focus:border-indigo-505 transition"
              >
                {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"].map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
              Aligned MBSSE Outcome
            </label>
            <input
              required
              type="text"
              value={alignedMbsseOutcome}
              onChange={(e) => setAlignedMbsseOutcome(e.target.value)}
              placeholder="e.g. Literacy Unit 3 - Reading Di Cotton Tree Scenarios"
              className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-505 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
              Syllabus Topics (Comma Separated)
            </label>
            <input
              required
              type="text"
              value={currTopicsRaw}
              onChange={(e) => setCurrTopicsRaw(e.target.value)}
              placeholder="silent reading, Bai Bureh history, Oral pronunciation..."
              className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-550 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">
              Lesson Notes / Description
            </label>
            <textarea
              required
              rows={3}
              value={currDescription}
              onChange={(e) => setCurrDescription(e.target.value)}
              placeholder="Provide details of di private school curriculum additions fɔh alignment reviews..."
              className="w-full bg-[#05060f] border border-indigo-900/50 rounded-2xl p-3 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-550 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {uploading ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <UploadCloud className="h-4 w-4" />}
            <span>Upload & Align Syllabus to MBSSE</span>
          </button>
        </form>
      )}

      {/* Published curricula list */}
      <div className="mt-8 border-t border-indigo-950 pt-5">
        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-4 flex items-center space-x-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Your Uploaded School Curriculums ({curriculums.length})</span>
        </h4>

        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {curriculums.map((curr) => (
            <div
              key={curr.id}
              className="p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950 hover:border-indigo-900/50 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-white uppercase">{curr.schoolName}</span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/15">
                  {curr.class_level}
                </span>
              </div>
              <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">{curr.description}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {curr.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] bg-slate-900 border border-slate-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 border-t border-indigo-950/40 pt-2 flex items-center justify-between font-semibold">
                <span className="text-[9px] text-indigo-500 uppercase font-bold">
                  MBSSE Goal: {curr.alignedMbsseOutcome}
                </span>
                <span className="text-[8.5px] text-zinc-500 font-mono">
                  {new Date(curr.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {curriculums.length === 0 && (
            <p className="text-[10px] text-slate-500 italic text-center py-6 font-mono">
              No custom syllabus uploads found in Cloud Database.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
