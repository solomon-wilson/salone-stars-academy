import type { ZodError } from "zod"
import type { Quest, Question } from "../dbManagerCore"
import { ApiError } from "./errors"

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior|above)\s+(instructions?|prompts?)/i,
  /\[INST\]/i,
  /\[SYS\]/i,
  /<\|system\|>/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /disregard\s+(all|previous)/i,
]

export const sanitizePromptInput = (str: string, maxLength = 200): string => {
  const trimmed = str.slice(0, maxLength)
  const cleaned = trimmed.replace(/[<>{}[\]]/g, "")
  if (INJECTION_PATTERNS.some(p => p.test(cleaned))) {
    throw new ApiError("VALIDATION_ERROR", "Input contains disallowed content.", 400)
  }
  return cleaned.trim()
}

export const zodFirstError = (err: ZodError): string =>
  err.issues[0]?.message || "Validation failed."

export const toQuest = (
  input: {
    id?: string
    title: string
    subject: string
    class_level: string
    points_award?: number
    difficulty?: string
    questions: Question[]
    source?: Quest["source"]
    teacherId?: string
    alignedMbsseOutcome?: string
  },
  defaults: { source: Quest["source"]; teacherId?: string }
): Quest => ({
  id: input.id || `q-${Math.random().toString(36).substring(2, 9)}`,
  title: input.title,
  subject: input.subject,
  class_level: input.class_level,
  points_award: input.points_award ?? 100,
  difficulty: input.difficulty ?? "Medium",
  questions: input.questions,
  source: input.source ?? defaults.source,
  teacherId: defaults.teacherId,
  alignedMbsseOutcome: input.alignedMbsseOutcome,
})
