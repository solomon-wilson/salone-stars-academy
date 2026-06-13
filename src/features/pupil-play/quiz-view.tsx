import { motion } from "motion/react"
import { Volume2, CheckCircle2, XCircle, Sparkles, AlertCircle } from "lucide-react"
import { speakText } from "../../lib/tts"
import type { Quest, Question } from "../../types"

type QuizViewProps = {
  activeQuest: Quest
  currentQuestionIndex: number
  selectedResponse: string | null
  isAnswerChecked: boolean
  isResponseCorrect: boolean
  onSelectResponse: (opt: string) => void
  onCheckAnswer: (question: Question) => void
  onAdvance: () => void
  onExit: () => void
}

export const QuizView = ({
  activeQuest,
  currentQuestionIndex,
  selectedResponse,
  isAnswerChecked,
  isResponseCorrect,
  onSelectResponse,
  onCheckAnswer,
  onAdvance,
  onExit,
}: QuizViewProps) => {
  const question = activeQuest.questions[currentQuestionIndex]

  return (
    <motion.div
      key="quest-active"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-[#111438] rounded-[32px] p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-600/10 blur-[80px] pointer-events-none"></div>

      {/* Quiz header */}
      <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50 mb-6 relative z-10">
        <div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
            Quest: {activeQuest.subject}
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1.5">{activeQuest.title}</h2>
        </div>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to exit di quest? Your current answers wont save until finished.")) {
              onExit()
            }
          }}
          className="text-xs text-indigo-400 hover:text-indigo-350 font-bold uppercase tracking-wider hover:underline cursor-pointer"
        >
          Exit Quest
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center space-x-2 mb-6 relative z-10">
        {activeQuest.questions.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full transition ${
              idx <= currentQuestionIndex
                ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                : "bg-indigo-950"
            }`}
          />
        ))}
        <span className="text-xs text-indigo-400 font-mono ml-3 font-semibold">
          {currentQuestionIndex + 1}/{activeQuest.questions.length}
        </span>
      </div>

      {/* Question body */}
      <div className="space-y-6 relative z-10">
        {/* Krio voice scaffolding banner */}
        <div className="bg-[#0f1233] border border-indigo-900/50 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 shadow-inner">
          <div className="flex items-start space-x-3">
            <Volume2 className="h-5 w-5 text-indigo-400 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Teacher Voice Assistance</h4>
              <p className="text-[11.5px] text-indigo-300 leading-normal italic pr-2">
                "{question.krioInstruction}"
              </p>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={() => speakText(question.krioInstruction, true)}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer uppercase tracking-wider text-[10px]"
            >
              <Volume2 className="h-3 w-3" />
              <span>Speak Krio</span>
            </button>
            <button
              onClick={() => speakText(question.questionText, false)}
              className="px-3 py-1.5 bg-slate-900 border border-indigo-900 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer uppercase tracking-wider text-[10px] text-slate-300 hover:bg-slate-950"
            >
              <Volume2 className="h-3 w-3" />
              <span>Speak English</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg text-white font-black leading-snug uppercase tracking-tight">
            {question.questionText}
          </h3>

          {/* Options grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt) => {
              const isSelected = selectedResponse === opt
              const isCorrect = opt === question.correctOption
              let btnStyle = "bg-[#0f1233]/40 border-indigo-900/50 hover:border-indigo-500/55 text-slate-200"

              if (isAnswerChecked) {
                if (isSelected) {
                  btnStyle = isCorrect
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-rose-950/40 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                } else if (isCorrect) {
                  btnStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                }
              } else if (isSelected) {
                btnStyle =
                  "bg-[#0f1233] border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              }

              return (
                <button
                  key={opt}
                  disabled={isAnswerChecked}
                  onClick={() => onSelectResponse(opt)}
                  className={`relative p-4 rounded-2xl border text-sm text-left transition duration-150 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {isAnswerChecked && isCorrect && opt === question.correctOption && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    )}
                    {isAnswerChecked && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Explanation slide */}
        {isAnswerChecked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
              isResponseCorrect
                ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                : "bg-amber-950/30 border-amber-800 text-amber-300"
            }`}
          >
            <div className="flex items-center space-x-1.5 font-bold mb-1">
              {isResponseCorrect ? (
                <>
                  <Sparkles className="h-4 w-4 animate-bounce" />
                  <span className="uppercase tracking-wider">Mek wi klab foh yu! (Awesome!) +20⭐ Stars</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span className="uppercase tracking-wider">Bortɔ dɔn. Tray Agɛn! (Explanation Helper)</span>
                </>
              )}
            </div>
            <p>{question.explanation}</p>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t border-indigo-900/50 flex justify-end space-x-3">
          {!isAnswerChecked ? (
            <button
              onClick={() => onCheckAnswer(question)}
              disabled={!selectedResponse}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition cursor-pointer ${
                selectedResponse
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-950/20"
                  : "bg-indigo-900/20 text-indigo-750 border border-indigo-900/30 cursor-not-allowed"
              }`}
            >
              Check My Answer
            </button>
          ) : (
            <button
              onClick={onAdvance}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-emerald-950/30 cursor-pointer"
            >
              {currentQuestionIndex === activeQuest.questions.length - 1
                ? `Finish Quest (+${activeQuest.points_award}⭐)`
                : "Next Question"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
