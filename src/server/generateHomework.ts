import { generateQuestDraft, type GenerateQuestInput } from "./generateQuest"

export interface GenerateHomeworkInput extends GenerateQuestInput {
  pupilId?: string
  weeklyTopics?: string
}

export async function generateHomeworkDraft(input: GenerateHomeworkInput) {
  const topic = input.weeklyTopics?.trim() || input.topic
  if (!topic) throw new Error("topic or weeklyTopics is required.")

  const draft = await generateQuestDraft({
    topic,
    subject: input.subject || "Mixed",
    class_level: input.class_level,
    difficulty: input.difficulty || "Medium",
    questionCount: input.questionCount ?? 4,
  })

  return {
    ...draft,
    source: "parent-pack" as const,
    pupilId: input.pupilId,
  }
}
