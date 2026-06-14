import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Send, ArrowLeft, Star, Loader2 } from "lucide-react"
import { apiFetch } from "../../lib/api-client"
import type { Quest, SholaMessage } from "../../types"

type SholaChatProps = {
  quest: Quest | null
  classLevel: string
  onExit: () => void
}

const SHOLA_AVATAR = "🌟"

export const SholaChat = ({ quest, classLevel, onExit }: SholaChatProps) => {
  const [messages, setMessages] = useState<SholaMessage[]>([
    {
      role: "shola",
      content: quest
        ? `Kushɛ, star explorer! I'm Shola, your learning guide. Let's explore "${quest.title}" together. What do you already know about ${quest.subject}? Don't worry if you're not sure — that's what I'm here for!`
        : `Kushɛ, star explorer! I'm Shola, your learning guide. What subject would you like to study today? I know all about Mathematics, Science, Social Studies, and English!`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [totalXp, setTotalXp] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return

    const pupilMsg: SholaMessage = {
      role: "pupil",
      content: text,
      timestamp: new Date().toISOString(),
    }

    const updated = [...messages, pupilMsg]
    setMessages(updated)
    setInput("")
    setSending(true)

    try {
      const resp = await apiFetch("/api/shola/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: updated,
          class_level: classLevel,
          questContext: quest ? `${quest.title} (${quest.subject})` : undefined,
        }),
      })

      if (resp.ok) {
        const { reply, xpAwarded } = await resp.json()
        setMessages(prev => [
          ...prev,
          { role: "shola", content: reply, timestamp: new Date().toISOString(), xpAwarded },
        ])
        if (xpAwarded > 0) setTotalXp(p => p + xpAwarded)
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "shola",
            content: "Sorry, I had a little trouble there. Let's try again — what was your question, friend?",
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "shola",
          content: "It looks like we lost connection. Check your internet and try again!",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <motion.div
      key="shola-chat"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col h-[600px] bg-[#0f1233]/80 backdrop-blur-md border border-indigo-900/50 rounded-[28px] overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border-b border-indigo-900/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-xl text-indigo-400 hover:text-indigo-200 hover:bg-indigo-900/40 cursor-pointer transition"
            aria-label="Exit Shola"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-2xl">{SHOLA_AVATAR}</div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wide">Shola</p>
            <p className="text-[10px] text-indigo-400">Your Sierra Leonean AI Study Guide</p>
          </div>
        </div>
        {totalXp > 0 && (
          <div className="flex items-center space-x-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-black text-yellow-400">+{totalXp} XP</span>
          </div>
        )}
      </div>

      {/* Quest context badge */}
      {quest && (
        <div className="px-5 pt-3">
          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-3 py-1.5 text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
            Studying: {quest.title} · {quest.subject}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "pupil" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "shola" && (
                <div className="text-xl mr-2 mt-1 shrink-0">{SHOLA_AVATAR}</div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "shola"
                    ? "bg-[#1a1f4d] border border-indigo-800/50 text-slate-200"
                    : "bg-gradient-to-br from-indigo-600 to-purple-700 text-white"
                }`}
              >
                {msg.content}
                {msg.xpAwarded && msg.xpAwarded > 0 && (
                  <div className="flex items-center space-x-1 mt-2 text-yellow-400 text-[10px] font-bold">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    <span>+{msg.xpAwarded} XP earned!</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div className="flex justify-start">
            <div className="text-xl mr-2 mt-1">{SHOLA_AVATAR}</div>
            <div className="bg-[#1a1f4d] border border-indigo-800/50 rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-indigo-900/50 bg-[#0a0c1e]/60">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Shola anything about this topic..."
            disabled={sending}
            className="flex-1 bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-40 text-white rounded-xl cursor-pointer transition shadow-lg"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-indigo-600 mt-2 text-center">
          Press Enter to send · Study sessions are not saved
        </p>
      </div>
    </motion.div>
  )
}
