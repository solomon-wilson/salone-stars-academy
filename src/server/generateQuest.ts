import { getGemini } from "./geminiService"
import type { Quest } from "../dbManagerCore"
import { sanitizePromptInput } from "./validation"

export interface GenerateQuestInput {
  topic: string
  subject: string
  class_level: string
  difficulty?: string
  questionCount?: number
}

export async function generateQuestDraft(input: GenerateQuestInput): Promise<Partial<Quest>> {
  const topic = sanitizePromptInput(input.topic, 200)
  const subject = sanitizePromptInput(input.subject, 128)
  const classLevel = sanitizePromptInput(input.class_level, 64)
  const difficulty = input.difficulty ? sanitizePromptInput(input.difficulty, 32) : "Medium"

  const ai = getGemini()
  const count = Math.min(input.questionCount ?? 5, 10)
  const prompt = `Generate a Sierra Leone MBSSE-aligned primary school quiz as JSON only (no markdown).
Topic: ${topic}
Subject: ${subject}
Class level: ${classLevel}
Difficulty: ${difficulty}
Questions: ${count}

Return JSON:
{
  "title": "string",
  "subject": "${subject}",
  "class_level": "${classLevel}",
  "points_award": number,
  "difficulty": "${difficulty}",
  "questions": [{
    "questionText": "string",
    "options": ["A","B","C","D"],
    "correctOption": "exact match from options",
    "explanation": "string",
    "krioInstruction": "short Krio phrase for TTS"
  }]
}

Use Sierra Leonean context (markets, rivers, local food). Keep language age-appropriate.`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  })

  const text = response.text?.trim()
  if (!text) throw new Error("Gemini returned empty quest draft.")

  const parsed = JSON.parse(text) as Partial<Quest>
  if (!parsed.title || !parsed.questions?.length) {
    throw new Error("Invalid quest structure from Gemini.")
  }

  return {
    ...parsed,
    subject,
    class_level: classLevel,
    source: "generated",
    questions: parsed.questions.slice(0, 20),
  }
}
