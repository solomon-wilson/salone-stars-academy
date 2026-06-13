import { useState } from "react"
import type { Quest, Question, PupilProfile } from "../../../types"

type QuizCallbacks = {
  onCorrectAnswer: (profileUpdater: (prev: PupilProfile) => PupilProfile, pointsDelta: number) => void
  onQuestComplete: (questId: string, pointsAward: number, subject: string) => void
  onAnswerRecorded?: (questId: string, subject: string, isCorrect: boolean) => void
}

export function useQuizEngine({ onCorrectAnswer, onQuestComplete, onAnswerRecorded }: QuizCallbacks) {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [isResponseCorrect, setIsResponseCorrect] = useState(false)

  const startQuest = (quest: Quest) => {
    setActiveQuest(quest)
    setCurrentQuestionIndex(0)
    setSelectedResponse(null)
    setIsAnswerChecked(false)
    setIsResponseCorrect(false)
  }

  const exitQuest = () => setActiveQuest(null)

  const checkAnswer = (question: Question) => {
    if (!selectedResponse || !activeQuest) return
    const isCorrect = selectedResponse === question.correctOption
    setIsResponseCorrect(isCorrect)
    setIsAnswerChecked(true)

    onAnswerRecorded?.(activeQuest.id, activeQuest.subject, isCorrect)

    if (isCorrect) {
      const quest = activeQuest
      onCorrectAnswer((prev) => {
        let newStreak = prev.streak_count
        const today = new Date().toISOString().split("T")[0]
        if (prev.last_active_date !== today) newStreak += 1

        const newBadges = [...prev.badges_earned]
        if (quest.subject === "Social Studies & Civics" && !newBadges.includes("Cotton Tree Scholar")) {
          newBadges.push("Cotton Tree Scholar")
        } else if (quest.subject === "General Science" && !newBadges.includes("Gola Forest Guardian")) {
          newBadges.push("Gola Forest Guardian")
        } else if (quest.subject === "Mathematics" && !newBadges.includes("Bintumani Climber") && prev.points >= 250) {
          newBadges.push("Bintumani Climber")
        }

        return {
          ...prev,
          points: prev.points + 20,
          streak_count: newStreak,
          last_active_date: today,
          badges_earned: newBadges,
        }
      }, 20)
    }
  }

  const advanceQuestion = () => {
    if (!activeQuest) return
    const isLast = currentQuestionIndex === activeQuest.questions.length - 1
    if (isLast) {
      onQuestComplete(activeQuest.id, activeQuest.points_award, activeQuest.subject)
      setActiveQuest(null)
      setCurrentQuestionIndex(0)
      setSelectedResponse(null)
      setIsAnswerChecked(false)
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedResponse(null)
      setIsAnswerChecked(false)
    }
  }

  return {
    activeQuest,
    currentQuestionIndex,
    selectedResponse,
    isAnswerChecked,
    isResponseCorrect,
    startQuest,
    exitQuest,
    checkAnswer,
    advanceQuestion,
    setSelectedResponse,
  }
}
