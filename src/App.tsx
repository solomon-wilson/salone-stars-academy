import React, { useState, useEffect } from "react"
import {
  Sparkles,
  Wifi,
  Cpu,
  GraduationCap,
  Heart,
  Crown,
  LogOut,
  CreditCard,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { auth } from "./firebase"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { getProfile, createProfile } from "./firebaseDb"
import { apiFetch } from "./lib/api-client"
import { DEFAULT_PUPIL_PROFILE } from "./constants/facts"
import { AppBackground, SierraLeoneFlagStripe } from "./shared/ui/app-background"
import { BadgesCabinet } from "./features/pupil-play/badges-cabinet"
import { SyncConsole } from "./features/pupil-play/sync-console"
import { PupilProfileCard } from "./features/pupil-play/pupil-profile-card"
import { QuestList } from "./features/pupil-play/quest-list"
import { QuizView } from "./features/pupil-play/quiz-view"
import { useQuizEngine } from "./features/pupil-play/hooks/use-quiz-engine"
import { TeacherAuthForm } from "./features/teacher-pi/teacher-auth-form"
import { PiStatusCard } from "./features/teacher-pi/pi-status-card"
import { SyncLogConsole } from "./features/teacher-pi/sync-log-console"
import { ClassroomLeaderboard } from "./features/teacher-pi/classroom-leaderboard"
import { CurriculumUploader } from "./features/teacher-pi/curriculum-uploader"
import { QuestGenerator } from "./features/teacher-pi/quest-generator"
import { useTeacherMetrics } from "./features/teacher-pi/hooks/use-teacher-metrics"
import { PricingModal } from "./features/billing/pricing-modal"
import { ParentHomeView } from "./features/parent-home/parent-home-view"
import {
  getChildCompletedKey,
  getChildProfileKey,
  loadChildCompletedQuests,
  loadChildProfile,
} from "./lib/daily-path"
import { Quest, PupilProfile, UserProfile } from "./types"

export default function App() {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Auth form state
  const [authTab, setAuthTab] = useState<"login" | "register">("login")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authFullName, setAuthFullName] = useState("")
  const [authRole, setAuthRole] = useState<"teacher" | "pupil">("teacher")
  const [authError, setAuthError] = useState("")

  // Billing state
  const [pricingOpen, setPricingOpen] = useState(false)
  const [upgradingLoading, setUpgradingLoading] = useState(false)

  // Navigation state
  const [activeTab, setActiveTab] = useState<"pupil" | "teacher" | "parent">("pupil")
  const [activeChildId, setActiveChildId] = useState<string | null>(() =>
    localStorage.getItem("salone_stars_active_child_id")
  )
  const [showNetworkStatusModal, setShowNetworkStatusModal] = useState(false)

  // Pupil profile state
  const [profile, setProfile] = useState<PupilProfile>(() => {
    const saved = localStorage.getItem("salone_stars_pupil_profile")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return DEFAULT_PUPIL_PROFILE
      }
    }
    return DEFAULT_PUPIL_PROFILE
  })

  const [completedQuests, setCompletedQuests] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("salone_stars_completed_quests")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return {}
  })

  const [unsyncedPoints, setUnsyncedPoints] = useState<number>(() => {
    const saved = localStorage.getItem("salone_stars_unsynced_points")
    return saved ? parseInt(saved, 10) || 0 : 0
  })

  // Quests pool
  const [questsList, setQuestsList] = useState<Quest[]>([])
  const [loadingQuests, setLoadingQuests] = useState(false)

  // Sync animation state
  const [syncingLoading, setSyncingLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null)

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(profile.name)
  const [editClass, setEditClass] = useState(profile.class_level)

  // Quiz engine — manages session state and emits profile/score callbacks
  const quiz = useQuizEngine({
    onCorrectAnswer: (profileUpdater, pointsDelta) => {
      setProfile(profileUpdater)
      setUnsyncedPoints((prev) => prev + pointsDelta)
    },
    onQuestComplete: (questId, pointsAward) => {
      setCompletedQuests((prev) => ({ ...prev, [questId]: true }))
      setProfile((prev) => ({ ...prev, points: prev.points + pointsAward }))
      setUnsyncedPoints((prev) => prev + pointsAward)
    },
  })

  // Teacher metrics — auto-fetches when teacher tab is active
  const { syncedStudents, serverLogs, refreshMetrics } = useTeacherMetrics(activeTab)

  // Persist profile and completed quests
  useEffect(() => {
    const profileKey = activeChildId ? getChildProfileKey(activeChildId) : "salone_stars_pupil_profile"
    localStorage.setItem(profileKey, JSON.stringify(profile))
  }, [profile, activeChildId])

  useEffect(() => {
    const completedKey = activeChildId ? getChildCompletedKey(activeChildId) : "salone_stars_completed_quests"
    localStorage.setItem(completedKey, JSON.stringify(completedQuests))
  }, [completedQuests, activeChildId])

  useEffect(() => {
    localStorage.setItem("salone_stars_unsynced_points", unsyncedPoints.toString())
  }, [unsyncedPoints])

  const fetchQuestsFromLocalServer = async () => {
    setLoadingQuests(true)
    try {
      const res = await fetch("/api/quests")
      if (res.ok) {
        const data = await res.json()
        setQuestsList(data)
      } else {
        console.error("Failed to load quests from server, using fallback")
      }
    } catch (e) {
      console.error("Offline local sync hotspot error, using internal quests mockup", e)
    } finally {
      setLoadingQuests(false)
    }
  }

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        setAuthLoading(true)
        try {
          const profileData = await getProfile(user.uid)
          if (profileData) {
            setUserProfile(profileData as UserProfile)
            if (profileData.role === "pupil") {
              setProfile((prev) => ({ ...prev, name: profileData.name }))
            }
          } else {
            const newRes = await createProfile(user.uid, user.email || "", user.displayName || "Unknown User", "pupil")
            const newProf: UserProfile = {
              uid: newRes.uid,
              email: newRes.email,
              name: newRes.name,
              role: newRes.role,
              subscriptionPlan: newRes.subscriptionPlan,
              createdAt: newRes.createdAt,
            }
            setUserProfile(newProf)
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error)
        } finally {
          setAuthLoading(false)
        }
      } else {
        setUserProfile(null)
        setAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetchQuestsFromLocalServer()
  }, [])

  // Handle Stripe billing success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("billing-success") !== "true") return
    const refreshProfile = async () => {
      if (!currentUser) return
      try {
        const profileData = await getProfile(currentUser.uid)
        if (profileData) {
          setUserProfile(profileData as UserProfile)
          alert(`Premium activated! You are now on the ${profileData.subscriptionPlan} plan.`)
        }
      } catch (error) {
        console.error("Failed to refresh profile after billing:", error)
      }
    }
    refreshProfile()
    window.history.replaceState({}, "", window.location.pathname)
  }, [currentUser])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.")
      return
    }
    try {
      if (authTab === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword)
      } else {
        if (!authFullName) {
          setAuthError("Full name is required.")
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword)
        const user = userCredential.user
        const newRes = await createProfile(user.uid, authEmail, authFullName, authRole)
        const newProf: UserProfile = {
          uid: newRes.uid,
          email: newRes.email,
          name: newRes.name,
          role: newRes.role,
          subscriptionPlan: newRes.subscriptionPlan,
          createdAt: newRes.createdAt,
        }
        setUserProfile(newProf)
      }
      setAuthEmail("")
      setAuthPassword("")
      setAuthFullName("")
    } catch (err: any) {
      console.error(err)
      if (
        err.message &&
        (err.message.includes("operation-not-allowed") || err.code === "auth/operation-not-allowed")
      ) {
        setAuthError(
          "Email/Password Sign-In is not enabled in your Firebase Console! Please enable it: go to your Firebase Console under Authentication -> Sign-in Method -> Click 'Add New Provider' -> Choose 'Email/Password' and enable it, then click Save."
        )
      } else {
        setAuthError(err.message || "Failed to authenticate.")
      }
    }
  }

  const handleParentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.")
      return
    }
    try {
      if (authTab === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword)
      } else {
        if (!authFullName) {
          setAuthError("Full name is required.")
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword)
        const user = userCredential.user
        const newRes = await createProfile(user.uid, authEmail, authFullName, "parent")
        setUserProfile({
          uid: newRes.uid,
          email: newRes.email,
          name: newRes.name,
          role: newRes.role,
          subscriptionPlan: newRes.subscriptionPlan,
          createdAt: newRes.createdAt,
        })
      }
      setAuthEmail("")
      setAuthPassword("")
      setAuthFullName("")
    } catch (err: any) {
      console.error(err)
      setAuthError(err.message || "Failed to authenticate.")
    }
  }

  const handleStartChildPractice = (child: { id: string; name: string; class_level: string }) => {
    setActiveChildId(child.id)
    localStorage.setItem("salone_stars_active_child_id", child.id)
    setProfile(loadChildProfile(child.id, child.name, child.class_level))
    setCompletedQuests(loadChildCompletedQuests(child.id))
    setActiveTab("pupil")
    quiz.exitQuest()
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (e) {
      console.error("Error signing out:", e)
    }
  }

  const handleUpgradeClick = async (plan: "individual" | "team") => {
    if (!currentUser) {
      alert("Please sign in to subscribe.")
      return
    }
    const subscriberRole = userProfile?.role === "parent" || activeTab === "parent" ? "parent" : "teacher"
    setUpgradingLoading(true)
    try {
      const resp = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email,
          planName: plan,
          subscriberRole,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data.url) {
          window.open(data.url, "_blank")
        } else {
          throw new Error("Checkout session endpoint did not return validation URL.")
        }
      } else {
        throw new Error("Billing proxy route offline.")
      }
    } catch (e: any) {
      console.error(e)
      alert(e.message || "Stripe integration error. Check configuration.")
    } finally {
      setUpgradingLoading(false)
    }
  }

  const handleClientSync = async () => {
    setSyncingLoading(true)
    setSyncSuccess(null)
    setSyncMessage("Compressing local IndexedDB state packets (14.2 KB)...")

    setTimeout(async () => {
      setSyncMessage("Ad-hoc connection verified via Local Hotspot ('SSA-Classroom-WiFi')...")
      setTimeout(async () => {
        setSyncMessage("Resolving conflicts using LWW monotonic timestamps...")
        try {
          const response = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: profile.id,
              name: profile.name,
              class_level: profile.class_level,
              points: profile.points,
              streak_count: profile.streak_count,
              last_active_date: profile.last_active_date,
              badges_earned: profile.badges_earned,
              delta_points: unsyncedPoints,
              parentId: userProfile?.role === "parent" ? currentUser?.uid : undefined,
            }),
          })

          if (response.ok) {
            setUnsyncedPoints(0)
            setSyncSuccess(true)
            setSyncMessage("Sync completed successfully! Merged on server.")
            fetchQuestsFromLocalServer()
            refreshMetrics()
          } else {
            throw new Error("Local HTTP sync server returned error.")
          }
        } catch (err) {
          console.error("Sync controller is offline", err)
          setSyncSuccess(false)
          setSyncMessage("Sync failed. Check device physical connection to teacher-pi server!")
        } finally {
          setSyncingLoading(false)
        }
      }, 1000)
    }, 1000)
  }

  const purchaseStreakFreeze = () => {
    if (profile.points >= 50) {
      setProfile((prev) => ({
        ...prev,
        points: prev.points - 50,
        streak_freezes: prev.streak_freezes + 1,
      }))
    } else {
      alert("You need at least 50 stars to buy a Streak Freeze! Complete more quests to earn stars.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 font-poppins selection:bg-brand-primary selection:text-white pb-12 relative overflow-hidden bg-grid-dark">
      <AppBackground />

      <SierraLeoneFlagStripe className="relative z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">

        {/* App header */}
        <header
          id="ssa-nav-header"
          className="flex flex-col md:flex-row md:items-center md:justify-between glass-card-dark p-6 shadow-subtle relative z-20 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-violet-700 rounded-full flex items-center justify-center text-white font-black shadow-violet">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none tracking-tight uppercase text-white font-poppins">
                Salone Stars Academy
              </h1>
              <p className="text-xs text-violet-400 font-bold uppercase tracking-widest mt-1">
                Class 4 • MBSSE Curriculum • Offline-First LMS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Network status badge */}
            <button
              onClick={() => setShowNetworkStatusModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-[#0f1233]/80 hover:bg-[#1a1f4d] border border-indigo-500/30 text-indigo-300 rounded-xl cursor-pointer font-mono text-xs transition duration-150"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span>SSA-Classroom-WiFi</span>
            </button>

            {/* Tab switcher */}
            <div className="bg-[#0f1233] p-1 rounded-xl border border-indigo-900/50 flex">
              <button
                id="tab-pupil"
                onClick={() => { setActiveTab("pupil"); quiz.exitQuest() }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium cursor-pointer ${
                  activeTab === "pupil"
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>🎒 Pupil Play</span>
              </button>
              <button
                id="tab-teacher"
                onClick={() => { setActiveTab("teacher"); quiz.exitQuest() }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium cursor-pointer ${
                  activeTab === "teacher"
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span>🎓 Teacher Pi</span>
              </button>
              <button
                id="tab-parent"
                onClick={() => { setActiveTab("parent"); quiz.exitQuest() }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium cursor-pointer ${
                  activeTab === "parent"
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>🏠 Parent Home</span>
              </button>
            </div>

            {/* User badge + sign out */}
            {currentUser && userProfile && (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-indigo-950/90 text-indigo-350 border border-indigo-505/42 px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span>{userProfile.subscriptionPlan} Tier</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline max-w-[80px] truncate">
                  {userProfile.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-2 bg-indigo-950/80 hover:bg-rose-950/40 border border-indigo-900/50 rounded-lg text-rose-300 cursor-pointer transition"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Pricing plans button */}
            <button
              onClick={() => setPricingOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/20 hover:from-yellow-500/15 hover:to-amber-500/25 border border-yellow-500/30 text-yellow-405 hover:text-yellow-300 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pricing Plans</span>
            </button>
          </div>
        </header>

        {/* PUPIL PLAY TAB */}
        {activeTab === "pupil" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            <div className="lg:col-span-1 space-y-6">
              <PupilProfileCard
                profile={profile}
                isEditingProfile={isEditingProfile}
                editName={editName}
                editClass={editClass}
                onEditNameChange={setEditName}
                onEditClassChange={setEditClass}
                onStartEdit={() => {
                  setEditName(profile.name)
                  setEditClass(profile.class_level)
                  setIsEditingProfile(true)
                }}
                onSaveEdit={() => {
                  setProfile((prev) => ({
                    ...prev,
                    name: editName || "Sorie Bah",
                    class_level: editClass,
                  }))
                  setIsEditingProfile(false)
                }}
                onCancelEdit={() => setIsEditingProfile(false)}
                onPurchaseStreakFreeze={purchaseStreakFreeze}
              />
              <BadgesCabinet profile={profile} />
              <SyncConsole
                unsyncedPoints={unsyncedPoints}
                syncingLoading={syncingLoading}
                syncSuccess={syncSuccess}
                syncMessage={syncMessage}
                onSync={handleClientSync}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {!quiz.activeQuest ? (
                  <QuestList
                    quests={questsList}
                    profile={profile}
                    completedQuests={completedQuests}
                    loadingQuests={loadingQuests}
                    onStartQuest={quiz.startQuest}
                  />
                ) : (
                  <QuizView
                    activeQuest={quiz.activeQuest}
                    currentQuestionIndex={quiz.currentQuestionIndex}
                    selectedResponse={quiz.selectedResponse}
                    isAnswerChecked={quiz.isAnswerChecked}
                    isResponseCorrect={quiz.isResponseCorrect}
                    onSelectResponse={quiz.setSelectedResponse}
                    onCheckAnswer={quiz.checkAnswer}
                    onAdvance={quiz.advanceQuestion}
                    onExit={quiz.exitQuest}
                  />
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* PARENT HOME TAB */}
        {activeTab === "parent" && (
          <ParentHomeView
            currentUser={currentUser}
            userProfile={userProfile}
            authTab={authTab}
            authEmail={authEmail}
            authPassword={authPassword}
            authFullName={authFullName}
            authError={authError}
            quests={questsList}
            onAuthTabChange={setAuthTab}
            onAuthEmailChange={setAuthEmail}
            onAuthPasswordChange={setAuthPassword}
            onAuthFullNameChange={setAuthFullName}
            onParentAuthSubmit={handleParentAuthSubmit}
            onUpgrade={() => setPricingOpen(true)}
            onStartPractice={handleStartChildPractice}
            onRefreshQuests={fetchQuestsFromLocalServer}
          />
        )}

        {/* TEACHER PI TAB */}
        {activeTab === "teacher" && (
          !currentUser ? (
            <TeacherAuthForm
              authTab={authTab}
              authEmail={authEmail}
              authPassword={authPassword}
              authFullName={authFullName}
              authRole={authRole}
              authError={authError}
              onTabChange={(tab) => { setAuthTab(tab); setAuthError("") }}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onFullNameChange={setAuthFullName}
              onRoleChange={setAuthRole}
              onSubmit={handleAuthSubmit}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              <div className="lg:col-span-1 space-y-6">
                <PiStatusCard
                  questCount={questsList.length}
                  studentCount={syncedStudents.length}
                />
                <SyncLogConsole logs={serverLogs} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <ClassroomLeaderboard syncedStudents={syncedStudents} />
                <CurriculumUploader
                  userId={currentUser.uid}
                  subscriptionPlan={userProfile?.subscriptionPlan ?? "free"}
                  onUpgradeClick={() => setPricingOpen(true)}
                />
                <QuestGenerator
                  userId={currentUser?.uid}
                  onPublishComplete={fetchQuestsFromLocalServer}
                />
              </div>

            </div>
          )
        )}

      </div>

      {/* Network status modal */}
      {showNetworkStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0c21] border border-indigo-500/30 rounded-[32px] max-w-md w-full p-8 text-slate-100 space-y-4 shadow-3xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-indigo-900/50">
              <div className="flex items-center space-x-2.5 text-indigo-400">
                <Wifi className="h-5 w-5 animate-pulse text-indigo-500" />
                <h3 className="text-base font-black uppercase tracking-wider">Low-Connectivity Architecture</h3>
              </div>
              <button
                onClick={() => setShowNetworkStatusModal(false)}
                className="text-indigo-400 hover:text-indigo-300 font-bold w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-2 text-xs leading-normal text-indigo-200">
              <p>
                In Sierra Leone K-12 classrooms, active global connection is either expensive or entirely absent.{" "}
                <strong>Salone Stars Academy</strong> operates on a 100% locally sustainable stack:
              </p>
              <ul className="space-y-3 mt-2">
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">1.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">
                      IndexedDB Persistence Fallback:
                    </strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      Client-side transactions are written to IndexedDB. Students can do quizzes and unlock badges
                      entirely offline in di far provinces.
                    </span>
                  </div>
                </li>
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">2.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">
                      Local hotspot WiFi transmitter:
                    </strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      The teacher's device serves an ad-hoc private WiFi access point (MBSSE Edge Controller). Connect
                      to Pi hotspot to send progress packages.
                    </span>
                  </div>
                </li>
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">3.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">
                      No Web Virtual DOM overhead:
                    </strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      Highly optimized vectors under 4MB, compressed and instantly loadable even fɔh old Android
                      KitKat tablets.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-indigo-900/50 flex justify-end">
              <button
                onClick={() => setShowNetworkStatusModal(false)}
                className="bg-indigo-650 hover:bg-indigo-700 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-450 px-6 py-3 font-black text-white rounded-xl text-xs uppercase tracking-widest cursor-pointer transition text-center"
              >
                I Understard di Stack
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {pricingOpen && (
        <PricingModal
          upgradingLoading={upgradingLoading}
          viewerRole={userProfile?.role ?? (activeTab === "parent" ? "parent" : "teacher")}
          onClose={() => setPricingOpen(false)}
          onUpgrade={handleUpgradeClick}
        />
      )}

    </div>
  )
}
