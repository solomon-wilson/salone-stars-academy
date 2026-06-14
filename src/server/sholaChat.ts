import type { SholaMessage } from "../dbManagerCore"
import { getGemini } from "./geminiService"

const XP_COOLDOWN_MS = 2 * 60 * 1000

async function checkXpCooldown(userId: string): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      const Redis = (await import("ioredis")).default
      const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true })
      await redis.connect()
      const key = `xp:shola:${userId}:last`
      const set = await redis.set(key, "1", "PX", XP_COOLDOWN_MS, "NX")
      await redis.quit()
      return set === "OK"
    } catch {
      /* fall through */
    }
  }
  return true
}

function buildSholaSystemPrompt(classLevel: string, questContext?: string): string {
  return `You are Shola, a warm and encouraging Sierra Leonean AI tutor for primary school pupils.

LEARNER PROFILE:
- Current class level: ${classLevel}
- Keep all explanations age-appropriate for a ${classLevel} pupil in Sierra Leone.

${questContext ? `TOPIC CONTEXT: The pupil is studying "${questContext}". Help them understand this topic.` : ""}

PERSONALITY & STYLE:
- You are friendly, patient, and enthusiastic about learning.
- Use simple, clear language appropriate for the class level.
- Occasionally sprinkle in Krio phrases to make learning feel familiar (e.g., "Well done, ehn!", "Yu do well!", "Aw di ansa go?").
- Use Sierra Leonean examples (markets, rivers, local food, animals, places).
- Address the pupil warmly — use "friend", "star learner", or "champion".

TEACHING METHOD (Socratic — guide, don't lecture):
- Ask one question at a time to check understanding.
- When the pupil answers correctly, celebrate and build on it.
- When wrong, guide gently: "Good try! Let's think again — what if we...?"
- Break complex ideas into very small steps.
- Use analogies from Sierra Leonean daily life.

GAMIFIED LANGUAGE:
- Frame learning as a quest: "You're earning stars with every answer!"
- Use encouragement: "Star explorer!", "Knowledge champion!", "You're climbing Bintumani Mountain!"

STRICT BOUNDARIES:
- NEVER generate quiz JSON or structured quest data.
- Only discuss topics within the Sierra Leone MBSSE primary school curriculum.
- Keep responses SHORT — maximum 4 sentences per reply.
- Never speak about violence, adult content, or anything outside school subjects.
- If the pupil goes off-topic, gently redirect: "Let's stay on our learning quest!"

END GOAL: After 3-4 exchanges, summarise what the pupil learned and encourage them to try a quest on this topic.`
}

export async function sholaChat(
  messages: SholaMessage[],
  classLevel: string,
  questContext?: string,
  userId?: string
): Promise<{ reply: string; xpAwarded: number }> {
  const ai = getGemini()
  const systemPrompt = buildSholaSystemPrompt(classLevel, questContext)

  const conversationHistory = messages.map(m => ({
    role: m.role === "shola" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood! I'm Shola, ready to guide this star learner. Yu du well foh kɔm!" }] },
      ...conversationHistory,
    ],
    config: { maxOutputTokens: 300 },
  })

  const reply = response.text?.trim() || "Sorry, I had trouble understanding. Can you try asking again, friend?"

  let xpAwarded = 0
  if (reply.length > 50 && userId) {
    const granted = await checkXpCooldown(userId)
    if (granted) xpAwarded = 5
  }

  return { reply, xpAwarded }
}
