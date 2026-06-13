import { useEffect, useMemo, useState } from "react"
import { AlertCircle } from "lucide-react"
import { ParentAuthForm } from "./parent-auth-form"
import { ChildProfileLinker } from "./child-profile-linker"
import { ProgressDigest } from "./progress-digest"
import { DailyPathCard } from "./daily-path-card"
import { WeeklyTopicForm } from "./weekly-topic-form"
import { ValueSummaryCard } from "./value-summary-card"
import { WhatsappOptInForm } from "./whatsapp-opt-in-form"
import { SchoolInviteLinker } from "./school-invite-linker"
import { useParentChildren } from "./hooks/use-parent-children"
import { useDailyPath } from "./hooks/use-daily-path"
import {
  getParentWeeklyNote,
  saveParentWeeklyNote,
  updateParentPreferences,
} from "../../firebaseDb"
import { getWeekKey, CLASS_LEVELS, PARENT_KRIO } from "../../constants/parent"
import { loadChildCompletedQuests } from "../../lib/daily-path"
import { mergePupilState } from "../../lib/pupil-state-merge"
import { loadQuestStats } from "../../lib/quest-stats"
import {
  getMonthlyPracticeSummary,
  getWeakSubjects,
  getWeeklyEngagement,
  isDailyQuestCompleted,
} from "../../lib/parent-insights"
import { apiFetch } from "../../lib/api-client"
import { ToastBanner, type ToastVariant } from "../../shared/ui/toast-banner"
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
  onProfileUpdated?: (profile: UserProfile) => void
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
  onProfileUpdated,
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
    refreshChildren,
  } = useParentChildren(isParent ? currentUser?.uid : undefined)

  const [childName, setChildName] = useState("")
  const [childClass, setChildClass] = useState<string>(CLASS_LEVELS[3])
  const [linking, setLinking] = useState(false)
  const [weeklyTopics, setWeeklyTopics] = useState("")
  const [savedWeeklyTopics, setSavedWeeklyTopics] = useState("")
  const [savingTopics, setSavingTopics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [homeworkDraft, setHomeworkDraft] = useState<Quest | null>(null)
  const [inviteCode, setInviteCode] = useState("")
  const [linkingInvite, setLinkingInvite] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState(userProfile?.whatsappPhone ?? "")
  const [digestOptIn, setDigestOptIn] = useState(userProfile?.digestOptIn ?? false)
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = (message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 5000)
  }

  const completedQuests = selectedChildId
    ? loadChildCompletedQuests(selectedChildId)
    : {}

  const { dailyQuest, subjectsThisWeek, isFallback } = useDailyPath({
    quests,
    classLevel: selectedChild?.class_level || childClass,
    completedQuests,
    weeklyTopics: savedWeeklyTopics || weeklyTopics,
    isPremium,
    childId: selectedChildId,
  })

  const merged = useMemo(() => {
    if (!selectedChild || !selectedChildId) return null
    return mergePupilState(selectedChild, selectedChildId, selectedChild.name, selectedChild.class_level)
  }, [selectedChild, selectedChildId])

  const questStats = selectedChildId ? loadQuestStats(selectedChildId) : []
  const weakSubjects = getWeakSubjects(questStats)
  const weeklyEngagement = merged
    ? getWeeklyEngagement(questStats, merged.last_active_date)
    : null
  const dailyQuestCompleted = isDailyQuestCompleted(dailyQuest?.id, completedQuests)
  const monthlySummary = getMonthlyPracticeSummary(questStats)

  const digestSubjects = merged?.subjectsThisWeek.length
    ? merged.subjectsThisWeek
    : subjectsThisWeek

  useEffect(() => {
    setWhatsappPhone(userProfile?.whatsappPhone ?? "")
    setDigestOptIn(userProfile?.digestOptIn ?? false)
  }, [userProfile?.whatsappPhone, userProfile?.digestOptIn])

  useEffect(() => {
    const loadNote = async () => {
      if (!currentUser || !isParent) return
      const note = await getParentWeeklyNote(currentUser.uid, getWeekKey())
      if (note) {
        setWeeklyTopics(note.topics)
        setSavedWeeklyTopics(note.topics)
      }
    }
    loadNote()
  }, [currentUser, isParent])

  const handleLinkChildClick = async () => {
    setLinking(true)
    const result = await handleLinkChild(childName, childClass)
    setLinking(false)
    if (result.ok) {
      setChildName("")
      showToast("Child profile linked!", "success")
    } else if (result.error) {
      showToast(result.error, "error")
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
      setSavedWeeklyTopics(weeklyTopics.trim())
      const preview = weeklyTopics.trim().split(/[,;\n]+/)[0]?.trim()
      showToast(
        preview
          ? `${PARENT_KRIO.topicPreview}: ${preview}`
          : "Weekly topics saved.",
        "success"
      )
    } catch (error) {
      console.error(error)
      showToast("Could not save weekly topics.", "error")
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
      showToast(error instanceof Error ? error.message : "Could not generate homework.", "error")
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
      showToast("Homework quest approved! Your child can practice it now.", "success")
    } catch (error) {
      console.error(error)
      showToast("Could not publish homework quest.", "error")
    }
  }

  const handleLinkByInvite = async () => {
    if (!currentUser || !inviteCode.trim()) return
    setLinkingInvite(true)
    try {
      const resp = await apiFetch("/api/parent/link-by-invite", {
        method: "POST",
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || "Link failed")
      }
      setInviteCode("")
      await refreshChildren()
      showToast("School child linked to your home account!", "success")
    } catch (error) {
      console.error(error)
      showToast(error instanceof Error ? error.message : "Could not link by invite code.", "error")
    } finally {
      setLinkingInvite(false)
    }
  }

  const handleSaveWhatsapp = async () => {
    if (!currentUser) return
    setSavingWhatsapp(true)
    try {
      await updateParentPreferences(currentUser.uid, {
        whatsappPhone: digestOptIn ? whatsappPhone.trim() : "",
        digestOptIn,
      })
      if (userProfile && onProfileUpdated) {
        onProfileUpdated({
          ...userProfile,
          whatsappPhone: digestOptIn ? whatsappPhone.trim() : undefined,
          digestOptIn,
        })
      }
      showToast("WhatsApp preferences saved.", "success")
    } catch (error) {
      console.error(error)
      showToast("Could not save WhatsApp preferences.", "error")
    } finally {
      setSavingWhatsapp(false)
    }
  }

  if (!currentUser || !isParent) {
    return (
      <div className="max-w-4xl mx-auto">
        {currentUser && userProfile && userProfile.role !== "parent" && (
          <div className="mb-4 flex items-start space-x-2 bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-amber-200 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
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
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <p>Your last payment failed. Premium access continues while Stripe retries — update your payment method to avoid losing your Daily Path and AI homework.</p>
    </div>
  ) : null

  const staleSyncBanner = merged?.syncStale ? (
    <div className="col-span-1 lg:col-span-3 flex items-start space-x-2 bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-amber-200 text-xs">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <p>{PARENT_KRIO.syncStale} Local progress is saved — sync when you have Wi‑Fi.</p>
    </div>
  ) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {toast && (
        <div className="col-span-1 lg:col-span-3">
          <ToastBanner
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
      {paymentFailedBanner}
      {staleSyncBanner}
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
        <SchoolInviteLinker
          inviteCode={inviteCode}
          linking={linkingInvite}
          onInviteCodeChange={setInviteCode}
          onLinkByInvite={handleLinkByInvite}
        />
        <ProgressDigest
          merged={merged}
          subjectsThisWeek={digestSubjects}
          weakSubjects={weakSubjects}
          weeklyEngagement={weeklyEngagement}
          dailyQuestCompleted={dailyQuestCompleted}
        />
        <ValueSummaryCard
          daysPracticed={monthlySummary.daysPracticed}
          questsCompleted={monthlySummary.questsCompleted}
          isPremium={isPremium}
        />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <DailyPathCard
          dailyQuest={dailyQuest}
          isPremium={isPremium}
          isFallback={isFallback}
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
        <WhatsappOptInForm
          phone={whatsappPhone}
          optIn={digestOptIn}
          saving={savingWhatsapp}
          onPhoneChange={setWhatsappPhone}
          onOptInChange={setDigestOptIn}
          onSave={handleSaveWhatsapp}
        />
      </div>
    </div>
  )
}
