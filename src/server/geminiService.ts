import { GoogleGenAI } from "@google/genai"

let geminiAI: GoogleGenAI | null = null

export const getGemini = (): GoogleGenAI => {
  if (!geminiAI) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error("GEMINI_API_KEY is required for AI features.")
    geminiAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "salone-stars-academy" } },
    })
  }
  return geminiAI
}
