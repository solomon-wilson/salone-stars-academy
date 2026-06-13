import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { ParentAuthForm } from "./parent-auth-form"
import { ChildProfileLinker } from "./child-profile-linker"
import { ProgressDigest } from "./progress-digest"
import { DailyPathCard } from "./daily-path-card"
import { WeeklyTopicForm } from "./weekly-topic-form"
import { useParentChildren } from "./hooks/use-parent-children"
import { useDailyPath } from "./hooks/use-daily-path"
import { getParentWeeklyNote, saveParentWeeklyNote } from "../../firebaseDb"
import { getWeekKey, CLASS_LEVELS } from "../../constants/parent"
import { loadChildCompletedQuests } from "../../lib/daily-path"
import { apiFetch } from "../../lib/api-client"
import type { Quest, UserProfile } from "../../types"

type ParentHomeViewProps = {
  currentUser: { uid: string; email: string | null } | null
  userProfile: UserProfile | null
  authTab: "login" | "register"
  authEmail: string
  authPassword: string
  authFullName: string
  authError: string
  quests: Quest[]
  onAuthTabChange: (tab: "login" | "register") => void
  onAuthEmailChange: (value: string) => void
  onAuthPasswordChange: (value: string) => void
  onAuthFullNameChange: (value: string) => void
  onParentAuthSubmit: (e: React.FormEvent) => void
  onUpgrade: () => void
  onStartPractice: (child: { id: string; name: string; class_level: string }) => void
  onRefreshQuests: () => void
}

export const ParentHomeView = ({
  currentUser,
  userProfile,
  authTab,
  authEmail,
  authPassword,
  authFullName,
  authError,
  quests,
  onAuthTabChange,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthFullNameChange,
  onParentAuthSubmit,
  onUpgrade,
  onStartPractice,
  onRefreshQuests,
}: ParentHomeViewProps) => {
  const isParent = userProfile?.role === "parent"
  const isPremium = userProfile?.subscriptionPlan === "individual" || userProfile?.subscriptionPlan === "team"

  const {
    children,
    selectedChild,
    selectedChildId,
    handleSelectChild,
    handleLinkChild,
    canLinkMore,
  } = useParentChildren(isParent ? currentUser?.uid : undefined)

  const [childName, setChildName] = useState("")
  const [childClass, setChildClass] = useState<string>(CLASS_LEVELS[3])
  const [linking, setLinking] = useState(false)
  const [weeklyTopics, setWeeklyTopics] = useState("")
  const [savingTopics, setSavingTopics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [homeworkDraft, setHomeworkDraft] = useState<Quest | null>(null)

  const completedQuests = selectedChildId
    ? loadChildCompletedQuests(selectedChildId)
    : {}

  const { dailyQuest, subjectsThisWeek } = useDailyPath({
    quests,
    classLevel: selectedChild?.class_level || childClass,
    completedQuests,
    weeklyTopics,
    isPremium,
  })

  useEffect(() => {
    const loadNote = async () => {
      if (!currentUser || !isParent) return
      const note = await getParentWeeklyNote(currentUser.uid, getWeekKey())
      if (note) setWeeklyTopics(note.topics)
    }
    loadNote()
  }, [currentUser, isParent])

  const handleLinkChildClick = async () => {
    setLinking(true)
    const result = await handleLinkChild(childName, childClass)
    setLinking(false)
    if (result.ok) {
      setChildName("")
      alert("Child profile linked!")
    } else if (result.error) {
      alert(result.error)
    }
  }

  const handleSaveTopics = async () => {
    if (!currentUser || !weeklyTopics.trim()) return
    setSavingTopics(true)
    try {
      await saveParentWeeklyNote({
        parentId: currentUser.uid,
        weekKey: getWeekKey(),
        topics: weeklyTopics.trim(),
        updatedAt: new Date().toISOString(),
      })
      alert("Weekly topics saved.")
    } catch (error) {
      console.error(error)
      alert("Could not save weekly topics.")
    } finally {
      setSavingTopics(false)
    }
  }

  const handleGenerateHomework = async () => {
    if (!selectedChild || !currentUser) return
    setGenerating(true)
    setHomeworkDraft(null)
    try {
      const resp = await apiFetch("/api/parent/generate-homework", {
        method: "POST",
        body: JSON.stringify({
          pupilId: selectedChild.id,
          class_level: selectedChild.class_level,
          topics: weeklyTopics,
          subject: "Mixed",
        }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || "Generation failed")
      }
      const draft = await resp.json()
      setHomeworkDraft({
        ...draft,
        id: `draft-${Date.now()}`,
        source: "generated",
      })
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Could not generate homework.")
    } finally {
      setGenerating(false)
    }
  }

  const handleApproveHomework = async () => {
    if (!homeworkDraft) return
    try {
      const resp = await apiFetch("/api/parent/publish-homework", {
        method: "POST",
        body: JSON.stringify(homeworkDraft),
      })
      if (!resp.ok) throw new Error("Publish failed")
      setHomeworkDraft(null)
      onRefreshQuests()
      alert("Homework quest approved! Your child can practice it now.")
    } catch (error) {
      console.error(error)
      alert("Could not publish homework quest.")
    }
  }

  if (!currentUser || !isParent) {
    return (
      <div className="max-w-4xl mx-auto">
        {currentUser && userProfile && userProfile.role !== "parent" && (
          <div className="mb-4 flex items-start space-x-2 bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-amber-200 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>You are signed in as a {userProfile.role}. Sign out and create a parent account, or use Teacher Pi for classroom tools.</p>
          </div>
        )}
        <ParentAuthForm
          authTab={authTab}
          authEmail={authEmail}
          authPassword={authPassword}
          authFullName={authFullName}
          authError={authError}
          onTabChange={onAuthTabChange}
          onEmailChange={onAuthEmailChange}
          onPasswordChange={onAuthPasswordChange}
          onFullNameChange={onAuthFullNameChange}
          onSubmit={onParentAuthSubmit}
        />
      </div>
    )
  }

  const paymentFailedBanner = isPremium && userProfile?.stripeSubscriptionStatus === "past_due" ? (
    <div className="col-span-1 lg:col-span-3 flex items-start space-x-2 bg-red-950/20 border border-red-800/40 rounded-xl p-4 text-red-200 text-xs">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <p>Your last payment failed. Premium access continues while Stripe retries — update your payment method to avoid losing your Daily Path and AI homework.</p>
    </div>
  ) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {paymentFailedBanner}
      <div className="lg:col-span-1 space-y-6">
        <ChildProfileLinker
          children={children}
          selectedChildId={selectedChildId}
          canLinkMore={canLinkMore}
          childName={childName}
          childClass={childClass}
          linking={linking}
          onChildNameChange={setChildName}
          onChildClassChange={setChildClass}
          onSelectChild={handleSelectChild}
          onLinkChild={handleLinkChildClick}
        />
        <ProgressDigest child={selectedChild} subjectsThisWeek={subjectsThisWeek} />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <DailyPathCard
          dailyQuest={dailyQuest}
          isPremium={isPremium}
          onStartPractice={() => selectedChild && onStartPractice(selectedChild)}
          onUpgrade={onUpgrade}
        />
        <WeeklyTopicForm
          topics={weeklyTopics}
          isPremium={isPremium}
          saving={savingTopics}
          generating={generating}
          generatedTitle={homeworkDraft?.title || null}
          onTopicsChange={setWeeklyTopics}
          onSaveTopics={handleSaveTopics}
          onGenerateHomework={handleGenerateHomework}
          onApproveHomework={handleApproveHomework}
        />
      </div>
    </div>
  )
}
