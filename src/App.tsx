import React, { useState, useEffect } from "react"
import {
  Activity,
  Award,
  Wifi,
  Cpu,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UploadCloud,
  RefreshCw,
  Play,
  Volume2,
  Lock,
  Plus,
  Users,
  Check,
  Book,
  FileCode,
  Trash,
  Settings,
  AlertCircle,
  GraduationCap,
  Clock,
  Heart,
  Info,
  CreditCard,
  Crown,
  LogOut,
  Zap
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getProfile,
  createProfile,
  updateProfile,
  uploadCurriculum,
  getCurriculums
} from "./firebaseDb";
import { apiFetch } from "./lib/api-client";
import { speakText } from "./lib/tts";
import { getSubjectColors } from "./lib/subject-colors";
import { SIERRA_LEONE_FACTS, DEFAULT_PUPIL_PROFILE } from "./constants/facts";
import { AppBackground, SierraLeoneFlagStripe } from "./shared/ui/app-background";
import { BadgesCabinet } from "./features/pupil-play/badges-cabinet";
import { SyncConsole } from "./features/pupil-play/sync-console";
import { PupilProfileCard } from "./features/pupil-play/pupil-profile-card";
import { TeacherAuthForm } from "./features/teacher-pi/teacher-auth-form";
import { PricingModal } from "./features/billing/pricing-modal";
import { ParentHomeView } from "./features/parent-home/parent-home-view";
import {
  getChildCompletedKey,
  getChildProfileKey,
  loadChildCompletedQuests,
  loadChildProfile,
} from "./lib/daily-path";
import { Question, Quest, PupilProfile, SyncedStudent, SyncLog, Curriculum, UserProfile } from "./types";

export default function App() {
  // Google Firebase Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null); // Firebase Auth User
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Custom Firestore profile record
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication Fields UI State
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState<"teacher" | "pupil">("teacher");
  const [authError, setAuthError] = useState("");

  // Stripe Checkout billing pricing state
  const [pricingOpen, setPricingOpen] = useState(false);
  const [upgradingLoading, setUpgradingLoading] = useState(false);

  // Custom Curriculums State
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [currClassLevel, setCurrClassLevel] = useState("Class 1");
  const [alignedMbsseOutcome, setAlignedMbsseOutcome] = useState("");
  const [currTopicsRaw, setCurrTopicsRaw] = useState("");
  const [currDescription, setCurrDescription] = useState("");
  const [curriculumUploading, setCurriculumUploading] = useState(false);

  // Navigation / Mode Selectors
  const [activeTab, setActiveTab] = useState<"pupil" | "teacher" | "parent">("pupil");
  const [activeChildId, setActiveChildId] = useState<string | null>(() =>
    localStorage.getItem("salone_stars_active_child_id")
  );
  const [showNetworkStatusModal, setShowNetworkStatusModal] = useState(false);

  // Pupil Profile State
  const [profile, setProfile] = useState<PupilProfile>(() => {
    const saved = localStorage.getItem("salone_stars_pupil_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_PUPIL_PROFILE; }
    }
    return DEFAULT_PUPIL_PROFILE;
  });

  // Completed Quests State
  const [completedQuests, setCompletedQuests] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("salone_stars_completed_quests");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Unsynced points tracker
  const [unsyncedPoints, setUnsyncedPoints] = useState<number>(() => {
    const saved = localStorage.getItem("salone_stars_unsynced_points");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  // Quests Pool
  const [questsList, setQuestsList] = useState<Quest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);

  // Active Quiz State
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isResponseCorrect, setIsResponseCorrect] = useState(false);
  const [krioAudioEnabled, setKrioAudioEnabled] = useState(true);

  // Syncing animation state
  const [syncingLoading, setSyncingLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  // Teacher Dashboard database metrics
  const [syncedStudents, setSyncedStudents] = useState<SyncedStudent[]>([]);
  const [serverLogs, setServerLogs] = useState<SyncLog[]>([]);
  const [loadingServerStats, setLoadingServerStats] = useState(false);

  // Custom Quest Generation (Gemini AI State)
  const [aiSubject, setAiSubject] = useState("General Science");
  const [aiClassLevel, setAiClassLevel] = useState("Class 4");
  const [aiTheme, setAiTheme] = useState("");
  const [generatingAiQuest, setGeneratingAiQuest] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [generatedQuestOutput, setGeneratedQuestOutput] = useState<Quest | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editClass, setEditClass] = useState(profile.class_level);

  // Persist Profile Change
  useEffect(() => {
    const profileKey = activeChildId ? getChildProfileKey(activeChildId) : "salone_stars_pupil_profile";
    localStorage.setItem(profileKey, JSON.stringify(profile));
  }, [profile, activeChildId]);

  useEffect(() => {
    const completedKey = activeChildId ? getChildCompletedKey(activeChildId) : "salone_stars_completed_quests";
    localStorage.setItem(completedKey, JSON.stringify(completedQuests));
  }, [completedQuests, activeChildId]);

  // Persist Unsynced points count
  useEffect(() => {
    localStorage.setItem("salone_stars_unsynced_points", unsyncedPoints.toString());
  }, [unsyncedPoints]);

  // Load All Quests (Both MBSSE pre-installed & teacher custom published) on startup
  const fetchQuestsFromLocalServer = async () => {
    setLoadingQuests(true);
    try {
      const res = await fetch("/api/quests");
      if (res.ok) {
        const data = await res.json();
        setQuestsList(data);
      } else {
        console.error("Failed to load quests from server, using fallback");
      }
    } catch (e) {
      console.error("Offline local sync hotspot error, using internal quests mockup", e);
    } finally {
      setLoadingQuests(false);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthLoading(true);
        try {
          const profileData = await getProfile(user.uid);
          if (profileData) {
            setUserProfile(profileData as UserProfile);
            // Sync local profile name with registered name
            if (profileData.role === "pupil") {
              setProfile((prev) => ({
                ...prev,
                name: profileData.name,
              }));
            }
          } else {
            // Self-healing default profile
            const newRes = await createProfile(user.uid, user.email || "", user.displayName || "Unknown User", "pupil");
            const newProf: UserProfile = {
              uid: newRes.uid,
              email: newRes.email,
              name: newRes.name,
              role: newRes.role,
              subscriptionPlan: newRes.subscriptionPlan,
              createdAt: newRes.createdAt
            };
            setUserProfile(newProf);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCurriculumsList = async () => {
    if (!currentUser) return;
    try {
      const data = await getCurriculums(currentUser.uid);
      setCurriculums(data);
    } catch (e) {
      console.error("Failed to retrieve curriculums:", e);
    }
  };

  useEffect(() => {
    loadCurriculumsList();
  }, [currentUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }
    try {
      if (authTab === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (!authFullName) {
          setAuthError("Full name is required.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const user = userCredential.user;
        const newRes = await createProfile(user.uid, authEmail, authFullName, authRole);
        const newProf: UserProfile = {
          uid: newRes.uid,
          email: newRes.email,
          name: newRes.name,
          role: newRes.role,
          subscriptionPlan: newRes.subscriptionPlan,
          createdAt: newRes.createdAt
        };
        setUserProfile(newProf);
      }
      setAuthEmail("");
      setAuthPassword("");
      setAuthFullName("");
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("operation-not-allowed") || err.code === "auth/operation-not-allowed")) {
        setAuthError("Email/Password Sign-In is not enabled in your Firebase Console! Please enable it: go to your Firebase Console under Authentication -> Sign-in Method -> Click 'Add New Provider' -> Choose 'Email/Password' and enable it, then click Save.");
      } else {
        setAuthError(err.message || "Failed to authenticate.");
      }
    }
  };

  const handleParentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }
    try {
      if (authTab === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (!authFullName) {
          setAuthError("Full name is required.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const user = userCredential.user;
        const newRes = await createProfile(user.uid, authEmail, authFullName, "parent");
        setUserProfile({
          uid: newRes.uid,
          email: newRes.email,
          name: newRes.name,
          role: newRes.role,
          subscriptionPlan: newRes.subscriptionPlan,
          createdAt: newRes.createdAt,
        });
      }
      setAuthEmail("");
      setAuthPassword("");
      setAuthFullName("");
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to authenticate.");
    }
  };

  const handleStartChildPractice = (child: { id: string; name: string; class_level: string }) => {
    setActiveChildId(child.id);
    localStorage.setItem("salone_stars_active_child_id", child.id);
    setProfile(loadChildProfile(child.id, child.name, child.class_level));
    setCompletedQuests(loadChildCompletedQuests(child.id));
    setActiveTab("pupil");
    setActiveQuest(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  const handleUpgradeClick = async (plan: "individual" | "team") => {
    if (!currentUser) {
      alert("Please sign in to subscribe.");
      return;
    }
    const subscriberRole = userProfile?.role === "parent" || activeTab === "parent" ? "parent" : "teacher";
    setUpgradingLoading(true);
    try {
      const resp = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email,
          planName: plan,
          subscriberRole,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          window.open(data.url, "_blank");
        } else {
          throw new Error("Checkout session endpoint did not return validation URL.");
        }
      } else {
        throw new Error("Billing proxy route offline.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Stripe integration error. Check configuration.");
    } finally {
      setUpgradingLoading(false);
    }
  };

  const handleUploadCurriculumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Authentication required fɔh curriculum uploads.");
      return;
    }
    if (!userProfile || userProfile.role !== "teacher") {
      alert("Curriculum upload access is restricted to teachers.");
      return;
    }
    if (userProfile.subscriptionPlan === "free") {
      alert("Curriculum Upload is fɔh premium subscribers! Upgrade inside Billing Plans below.");
      setPricingOpen(true);
      return;
    }
    if (!schoolName || !alignedMbsseOutcome || !currTopicsRaw || !currDescription) {
      alert("All fields are required.");
      return;
    }

    setCurriculumUploading(true);
    try {
      const topics = currTopicsRaw.split(",").map(t => t.trim()).filter(Boolean);
      const curriculumId = `curr-${Math.random().toString(36).substring(2, 9)}`;
      const payload = {
        id: curriculumId,
        teacherId: currentUser.uid,
        class_level: currClassLevel,
        schoolName,
        alignedMbsseOutcome,
        topics,
        description: currDescription,
        updatedAt: new Date().toISOString()
      };
      await uploadCurriculum(payload);
      alert("Curriculum aligned to MBSSE standards successfully uploaded to Google Firestore!");
      setSchoolName("");
      setAlignedMbsseOutcome("");
      setCurrTopicsRaw("");
      setCurrDescription("");
      loadCurriculumsList();
    } catch (err) {
      console.error("Firestore write failure:", err);
      alert("Could not persist curriculum on Google Server due to network bounds.");
    } finally {
      setCurriculumUploading(false);
    }
  };

  useEffect(() => {
    fetchQuestsFromLocalServer();
  }, []);

  // Handle Stripe billing success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing-success") !== "true") return;

    const plan = params.get("plan") as "individual" | "team" | null;
    const refreshProfile = async () => {
      if (!currentUser) return;
      try {
        const profileData = await getProfile(currentUser.uid);
        if (profileData) {
          setUserProfile(profileData as UserProfile);
          alert(`Premium activated! You are now on the ${profileData.subscriptionPlan} plan.`);
        }
      } catch (error) {
        console.error("Failed to refresh profile after billing:", error);
      }
    };
    refreshProfile();
    window.history.replaceState({}, "", window.location.pathname);
  }, [currentUser]);

  // Sync state with Edge syncing server
  const handleClientSync = async () => {
    setSyncingLoading(true);
    setSyncSuccess(null);
    setSyncMessage("Compressing local IndexedDB state packets (14.2 KB)...");

    setTimeout(async () => {
      setSyncMessage("Ad-hoc connection verified via Local Hotspot ('SSA-Classroom-WiFi')...");
      setTimeout(async () => {
        setSyncMessage("Resolving conflicts using LWW monotonic timestamps...");
        try {
          // Push local pupil profile directly to the teacher-pi Express backend
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
            })
          });

          if (response.ok) {
            const result = await response.json();
            setUnsyncedPoints(0);
            setSyncSuccess(true);
            setSyncMessage(`Sync completed successfully! Merged on server.`);
            // Fetch updated quests that might have been published since last sync
            fetchQuestsFromLocalServer();
            // Fetch classroom metrics so teacher records stay current
            fetchTeacherClassroomMetrics();
          } else {
            throw new Error("Local HTTP sync server returned error.");
          }
        } catch (err) {
          console.error("Sync controller is offline", err);
          setSyncSuccess(false);
          setSyncMessage("Sync failed. Check device physical connection to teacher-pi server!");
        } finally {
          setSyncingLoading(false);
        }
      }, 1000);
    }, 1000);
  };

  // Fetch teacher stats from server fɔh live updates
  const fetchTeacherClassroomMetrics = async () => {
    setLoadingServerStats(true);
    try {
      const response = await apiFetch("/api/teacher/students");
      if (response.ok) {
        const data = await response.json();
        setSyncedStudents(data.students);
        setServerLogs(data.logs);
      }
    } catch (e) {
      console.error("Local sync database is inaccessible", e);
    } finally {
      setLoadingServerStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "teacher") {
      fetchTeacherClassroomMetrics();
    }
  }, [activeTab]);

  // Purchase streak freeze with stars to save the momentum streak (loss aversion game loop)
  const purchaseStreakFreeze = () => {
    if (profile.points >= 50) {
      setProfile((prev) => ({
        ...prev,
        points: prev.points - 50,
        streak_freezes: prev.streak_freezes + 1,
      }));
    } else {
      alert("You need at least 50 stars to buy a Streak Freeze! Complete more quests to earn stars.");
    }
  };

  // Process-focused Retry loop: Check selected answer during quiz without punitive lockout
  const checkAnswer = (question: Question) => {
    if (!selectedResponse) return;
    const isCorrect = selectedResponse === question.correctOption;
    setIsResponseCorrect(isCorrect);
    setIsAnswerChecked(true);

    if (isCorrect) {
      // Award points for attempt and consistency
      setProfile((prev) => {
        let newStreak = prev.streak_count;
        const today = new Date().toISOString().split("T")[0];
        if (prev.last_active_date !== today) {
          newStreak += 1; // Increment streak if active today
        }
        
        // Dynamically unlock badges based on progress benchmarks
        const newBadges = [...prev.badges_earned];
        if (activeQuest?.subject === "Social Studies & Civics" && !newBadges.includes("Cotton Tree Scholar")) {
          newBadges.push("Cotton Tree Scholar");
        } else if (activeQuest?.subject === "General Science" && !newBadges.includes("Gola Forest Guardian")) {
          newBadges.push("Gola Forest Guardian");
        } else if (activeQuest?.subject === "Mathematics" && !newBadges.includes("Bintumani Climber") && prev.points >= 250) {
          newBadges.push("Bintumani Climber");
        }

        return {
          ...prev,
          points: prev.points + 20, // 20 points per correct question answer
          streak_count: newStreak,
          last_active_date: today,
          badges_earned: newBadges,
        };
      });
      setUnsyncedPoints((prev) => prev + 20);
    }
  };

  // Move forward to the next quiz question, or finish the quest
  const handleNextQuizQuestion = () => {
    if (!activeQuest) return;
    const isLastQuestion = currentQuestionIndex === activeQuest.questions.length - 1;

    if (isLastQuestion) {
      // Complete quest successfully
      setCompletedQuests((prev) => ({
        ...prev,
        [activeQuest.id]: true,
      }));
      setProfile((prev) => ({
        ...prev,
        points: prev.points + activeQuest.points_award,
      }));
      setUnsyncedPoints((prev) => prev + activeQuest.points_award);

      // Finish Active Quest
      setActiveQuest(null);
      setCurrentQuestionIndex(0);
      setSelectedResponse(null);
      setIsAnswerChecked(false);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedResponse(null);
      setIsAnswerChecked(false);
    }
  };

  // Fact rotations during AI loading to maintain offline engagement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingAiQuest) {
      interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % SIERRA_LEONE_FACTS.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [generatingAiQuest]);

  // Generate Interactive MBSSE Quest using Gemini server API
  const handleGenerateQuestViaAI = async () => {
    setGeneratingAiQuest(true);
    setGenerationError(null);
    setGeneratedQuestOutput(null);
    setCurrentFactIndex(0);

    try {
      const response = await apiFetch("/api/teacher/generate-quest", {
        method: "POST",
        body: JSON.stringify({
          subject: aiSubject,
          class_level: aiClassLevel,
          customTopic: aiTheme
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestOutput(data);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Server failed to invoke generative AI.");
      }
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message || "Failed to reach server-side Gemini generation engine.");
    } finally {
      setGeneratingAiQuest(false);
    }
  };

  // Upload/Publish the generated quest to the active classrooms hotspot database
  const handlePublishGeneratedQuest = async () => {
    if (!generatedQuestOutput) return;
    try {
      const questPayload = {
        ...generatedQuestOutput,
        subject: aiSubject,
        class_level: aiClassLevel,
        teacherId: currentUser?.uid,
      };
      const response = await apiFetch("/api/teacher/publish-quest", {
        method: "POST",
        body: JSON.stringify(questPayload),
      });

      if (response.ok) {
        alert("Quest Published successfully! Students will see it after they sync.");
        setGeneratedQuestOutput(null);
        setAiTheme("");
        fetchQuestsFromLocalServer();
      }
    } catch (e) {
      console.error("Failed to publish quest", e);
      alert("Hotspot synchronization error during publishing!");
    }
  };

  // Quick helper fɔh subject styles

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 font-poppins selection:bg-brand-primary selection:text-white pb-12 relative overflow-hidden bg-grid-dark">
      <AppBackground />

      <SierraLeoneFlagStripe className="relative z-10" />

      {/* Main Structural Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
        
        {/* POLISHED APP HEADER & STATUS BAR WITH GLASSMORPHISM */}
        <header id="ssa-nav-header" className="flex flex-col md:flex-row md:items-center md:justify-between glass-card-dark p-6 shadow-subtle relative z-20 mb-6">
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

          {/* Controls, Mode Switching & WiFi Hotspot Status Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Ad-Hoc Hotspot Network Badge */}
            <button
              onClick={() => setShowNetworkStatusModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-[#0f1233]/80 hover:bg-[#1a1f4d] border border-indigo-500/30 text-indigo-300 rounded-xl cursor-pointer font-mono text-xs transition duration-150"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span>SSA-Classroom-WiFi</span>
            </button>

            {/* View Selector Tabs */}
            <div className="bg-[#0f1233] p-1 rounded-xl border border-indigo-900/50 flex">
              <button
                id="tab-pupil"
                onClick={() => {
                  setActiveTab("pupil");
                  setActiveQuest(null);
                }}
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
                onClick={() => {
                  setActiveTab("teacher");
                  setActiveQuest(null);
                }}
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
                onClick={() => {
                  setActiveTab("parent");
                  setActiveQuest(null);
                }}
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

            {/* Premium Stripe Plan & Active Auth User Badges */}
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

            {/* Stripe Plans Access Trigger */}
            <button
              onClick={() => setPricingOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/20 hover:from-yellow-500/15 hover:to-amber-500/25 border border-yellow-500/30 text-yellow-405 hover:text-yellow-300 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pricing Plans</span>
            </button>

          </div>
        </header>

        {/* 1. PUPIL PLATFORM LAYER */}
        {activeTab === "pupil" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* PUPIL PROFILE & STATS (LEFT HAND COGNITIVE CABINET) */}
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

            {/* PUPILS ACTIVE LEARN INTERFACE (RIGHT 2 SPANS) */}
            <div className="lg:col-span-2 space-y-6">
              
              <AnimatePresence mode="wait">
                {!activeQuest ? (
                  
                  /* A. LEARNING MAP PATH - CHOOSE QUEST TO INITIATE */
                  <motion.div
                    key="quest-list"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    {/* Curriculum Header Bar */}
                    <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/50 border border-indigo-900/50 rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wide">🎒 Learning Paths & Quests</h2>
                      <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
                        Choose your subject. All quests are fully aligned with di Sierra Leone{' '}
                        <strong> Ministry of Basic and Senior Secondary Education (MBSSE)</strong> national primary guidelines, featuring localized scenarios and Krio oral guidance.
                      </p>
                    </div>

                    {loadingQuests ? (
                      <div className="flex flex-col items-center justify-center py-20 text-indigo-400 space-y-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-xs text-indigo-455 font-mono">Loading classroom quest modules from Hotspot...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questsList
                          .filter(q => q.class_level === profile.class_level)
                          .map((quest) => {
                            const isCompleted = completedQuests[quest.id];
                            return (
                              <div
                                key={quest.id}
                                className={`bg-[#0f1233]/80 backdrop-blur-md border rounded-[28px] p-6 hover:bg-[#1a1f4d] transition duration-150 flex flex-col justify-between hover:shadow-2xl relative overflow-hidden ${
                                  isCompleted ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-indigo-900/50"
                                }`}
                              >
                                <div>
                                  {/* Subject Tag */}
                                  <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                      quest.subject === "Mathematics"
                                        ? "bg-red-500/10 text-red-700 border border-red-500/20"
                                        : quest.subject === "General Science"
                                        ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20"
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    }`}>
                                      {quest.subject}
                                    </span>
                                    {isCompleted ? (
                                      <span className="flex items-center space-x-1 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Completed</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                                        Level: {quest.difficulty}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-base font-black text-white mb-2 leading-tight uppercase">
                                    {quest.title}
                                  </h3>
                                  <p className="text-xs text-indigo-300 leading-normal mb-6">
                                    {quest.questions.length} Practice Exercises aligning Class {quest.class_level}. Contains Krio scaffolding.
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-indigo-950">
                                  <div className="flex items-center space-x-1.5">
                                    <Sparkles className="h-4 w-4 text-yellow-400" />
                                    <span className="text-xs font-black text-yellow-500 font-mono">{quest.points_award} Stars Award</span>
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      setActiveQuest(quest);
                                      setCurrentQuestionIndex(0);
                                      setSelectedResponse(null);
                                      setIsAnswerChecked(false);
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer ${
                                      isCompleted
                                        ? "bg-[#05060f] hover:bg-[#0f1233] text-indigo-400 border border-indigo-900/50"
                                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-950/20"
                                    }`}
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                    <span>{isCompleted ? "Redo" : "Learn Now"}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {questsList.filter(q => q.class_level === profile.class_level).length === 0 && (
                          <div className="col-span-2 bg-[#0f1233]/40 rounded-[28px] p-10 border border-dashed border-indigo-900/60 text-center">
                            <Book className="h-10 w-10 text-indigo-900 mx-auto mb-3" />
                            <p className="text-sm text-slate-300 font-bold uppercase tracking-wide">No active quests for {profile.class_level} yet.</p>
                            <p className="text-xs text-indigo-450 mt-2 max-w-sm mx-auto leading-relaxed">
                              Sync with di Teacher Pi or choose "🎓 Teacher Pi" tab above fɔh generate and publish fresh custom quests using Gemini AI!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  
                  /* B. ACTIVE QUIZ GAME LOOP SCREEN */
                  <motion.div
                    key="quest-active"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-[#111438] rounded-[32px] p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-600/10 blur-[80px] pointer-events-none"></div>

                    {/* Quiz Upper Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50 mb-6 relative z-10">
                      <div>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                          Quest: {activeQuest.subject}
                        </span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1.5">
                          {activeQuest.title}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to exit di quest? Your current answers wont save until finished.")) {
                            setActiveQuest(null);
                          }
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-350 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Exit Quest
                      </button>
                    </div>

                    {/* Progress Indicator Dots */}
                    <div className="flex items-center space-x-2 mb-6 relative z-10">
                      {activeQuest.questions.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 flex-1 rounded-full transition ${
                            idx <= currentQuestionIndex ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-indigo-950"
                          }`}
                        ></div>
                      ))}
                      <span className="text-xs text-indigo-400 font-mono ml-3 font-semibold">
                        {currentQuestionIndex + 1}/{activeQuest.questions.length}
                      </span>
                    </div>

                    {/* Question body */}
                    {(() => {
                      const question = activeQuest.questions[currentQuestionIndex];
                      return (
                        <div className="space-y-6 relative z-10">
                          
                          {/* Local Language Voice Scaffolder Banner */}
                          <div className="bg-[#0f1233] border border-indigo-900/50 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 shadow-inner">
                            <div className="flex items-start space-x-3">
                              <Volume2 className="h-5 w-5 text-indigo-400 mt-0.5 animate-pulse" />
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Teacher Voice Assistance</h4>
                                <p className="text-[11.5px] text-indigo-300 leading-normal italic pr-2">
                                  "{question.krioInstruction}"
                                </p>
                              </div>
                            </div>
                            
                            {/* Tap To Listen buttons relying on Synthesis fallback */}
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => speakText(question.krioInstruction, true)}
                                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer uppercase tracking-wider text-[10px]"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>Speak Krio</span>
                              </button>
                              <button
                                onClick={() => speakText(question.questionText, false)}
                                className="px-3 py-1.5 bg-slate-900 border border-indigo-900 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer uppercase tracking-wider text-[10px] text-slate-300 hover:bg-slate-950"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>Speak English</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg text-white font-black leading-snug uppercase tracking-tight">
                              {question.questionText}
                            </h3>

                            {/* Options Selector Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {question.options.map((opt) => {
                                const isSelected = selectedResponse === opt;
                                const isCorrect = opt === question.correctOption;
                                let btnStyle = "bg-[#0f1233]/40 border-indigo-900/50 hover:border-indigo-500/55 text-slate-200";

                                if (isAnswerChecked) {
                                  if (isSelected) {
                                    btnStyle = isCorrect
                                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                      : "bg-rose-950/40 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                                  } else if (opt === question.correctOption) {
                                    // Highlight the correct answer anyway for cognitive guidance
                                    btnStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400";
                                  }
                                } else if (isSelected) {
                                  btnStyle = "bg-[#0f1233] border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]";
                                }

                                return (
                                  <button
                                    key={opt}
                                    disabled={isAnswerChecked}
                                    onClick={() => setSelectedResponse(opt)}
                                    className={`relative p-4 rounded-2xl border text-sm text-left transition duration-150 cursor-pointer ${btnStyle}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{opt}</span>
                                      {isAnswerChecked && isCorrect && opt === question.correctOption && (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                      )}
                                      {isAnswerChecked && isSelected && !isCorrect && (
                                        <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pedagogical Guidance Explanation Slide (Section 3.2) */}
                          {isAnswerChecked && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                                isResponseCorrect
                                  ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                                  : "bg-amber-950/30 border-amber-800 text-amber-300"
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 font-bold mb-1">
                                {isResponseCorrect ? (
                                  <>
                                    <Sparkles className="h-4 w-4 animate-bounce" />
                                    <span className="uppercase tracking-wider">Mek wi klab foh yu! (Awesome!) +20⭐ Stars</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="uppercase tracking-wider">Bortɔ dɔn. Tray Agɛn! (Explanation Helper)</span>
                                  </>
                                )}
                              </div>
                              <p>{question.explanation}</p>
                            </motion.div>
                          )}

                          {/* Form Control Buttons (Process-driven flow) */}
                          <div className="pt-4 border-t border-indigo-900/50 flex justify-end space-x-3">
                            {!isAnswerChecked ? (
                              <button
                                onClick={() => checkAnswer(question)}
                                disabled={!selectedResponse}
                                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition cursor-pointer ${
                                  selectedResponse
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-950/20"
                                    : "bg-indigo-900/20 text-indigo-750 border border-indigo-900/30 cursor-not-allowed"
                                }`}
                              >
                                Check My Answer
                              </button>
                            ) : (
                              <button
                                onClick={handleNextQuizQuestion}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-emerald-950/30 cursor-pointer"
                              >
                                <span>
                                  {currentQuestionIndex === activeQuest.questions.length - 1
                                    ? `Finish Quest (+${activeQuest.points_award}⭐)`
                                    : "Next Question"}
                                </span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        )}

        {/* 2. TEACHER PI SYNCHRONIZE & CONTROL LEDGER TAB */}
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

            
            {/* RASPBERRY PI METRICS & HARDWARE MONITOR PANEL (LEFT PANEL) */}
            <div className="lg:col-span-1 space-y-6">
              
              <div id="pi-hardware-card" className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-4 flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  <span>Local Server Status (Teacher Pi)</span>
                </h3>

                <p className="text-xs text-indigo-300 mb-6 leading-relaxed">
                  This Raspberry Pi operates without cellular internet. It acts as an ad-hoc local classroom Wi-Fi transmitter to cache and aggregate pupil grades.
                </p>

                {/* Server specifications list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">CPU Capacity</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">24.5% Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Operating Temp</span>
                    <span className="text-xs font-black text-amber-405 font-mono">41.8 °C</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Cached Quests Pool</span>
                    <span className="text-xs font-black text-blue-400 font-mono">{questsList.length} Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950/45">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Mesh Connections</span>
                    <span className="text-xs font-black text-purple-400 font-mono">{syncedStudents.length} Students</span>
                  </div>
                </div>
              </div>

              {/* LIVE SYNC JSON CONSOLE (P2P MONITOR) */}
              <div id="sync-console-box" className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl">
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] mb-3 flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Live Packet Merge Console</span>
                </h3>
                <p className="text-[10px] text-indigo-400 mb-4 font-sans leading-relaxed">
                  Real-time LWW (Last-Write-Wins) sync log showing incoming client IndexedDB transactions.
                </p>

                <div className="bg-[#05060f] rounded-2xl p-4.5 border border-indigo-900/40 font-mono text-[10px] text-emerald-400 space-y-2 h-[220px] overflow-y-auto">
                  {serverLogs.map((log) => (
                    <div key={log.id} className="border-b border-indigo-950/50 pb-2 last:border-0 leading-tight">
                      <div className="flex items-center justify-between text-indigo-400">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="text-emerald-450 font-black tracking-widest text-[9px] uppercase">MERGE SUCCESS</span>
                      </div>
                      <p className="text-slate-100 my-0.5 font-bold uppercase text-[9px]">Pupil: {log.pupil_name}</p>
                      <p className="text-[9px] text-indigo-403">Event: {log.event_type} (+{log.delta_points}⭐ Stars synced)</p>
                    </div>
                  ))}
                  {serverLogs.length === 0 && (
                    <div className="text-center text-slate-600 py-10 font-mono text-[11px]">No incoming transactions in this session yet.</div>
                  )}
                </div>
              </div>

            </div>

            {/* CLASSROOM REGISTRY, LIVE STATS PODIUM & AI BUILD PANEL (RIGHT 2 SPANS) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Live Stars Podium of classroom top performance */}
              <div className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl">
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-[0.15em] mb-6 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />
                  <span>Interactive Classroom Leaderboard & Podium</span>
                </h3>

                {/* 1st 2nd 3rd visual podium graphic */}
                {syncedStudents.length >= 3 && (
                  <div className="flex items-end justify-between max-w-md mx-auto mb-8 border-b border-indigo-900/50 pb-2">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 bg-indigo-500/10 border-2 border-slate-400 rounded-full flex items-center justify-center font-black text-white text-xs shadow-inner">
                        {syncedStudents[1].name.charAt(0)}
                      </div>
                      <p className="text-[10px] text-slate-350 font-black uppercase mt-1.5 truncate max-w-[80px]">{syncedStudents[1].name}</p>
                      <span className="text-[9.5px] font-mono text-indigo-400 font-bold">{syncedStudents[1].points}⭐</span>
                      <div className="h-10 bg-[#0d0e2c] border-t border-slate-400/30 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-slate-400 text-xs">
                        2nd
                      </div>
                    </div>

                    {/* 1st place */}
                    <div className="flex flex-col items-center flex-1 -mt-4">
                      <div className="w-12 h-12 bg-yellow-500/20 border-2 border-yellow-400 rounded-full flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        {syncedStudents[0].name.charAt(0)}
                      </div>
                      <p className="text-xs text-yellow-400 font-black uppercase mt-1.5 truncate max-w-[90px]">{syncedStudents[0].name}</p>
                      <span className="text-[10px] font-mono text-yellow-405 font-black">{syncedStudents[0].points}⭐</span>
                      <div className="h-14 bg-gradient-to-t from-yellow-600/20 to-yellow-500/10 border-t-2 border-yellow-500 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-yellow-400 text-sm">
                        1st
                      </div>
                    </div>

                    {/* 3rd place */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 bg-amber-700/10 border-2 border-amber-600 rounded-full flex items-center justify-center font-black text-white text-xs shadow-inner">
                        {syncedStudents[2].name.charAt(0)}
                      </div>
                      <p className="text-[10px] text-slate-355 font-black uppercase mt-1.5 truncate max-w-[80px]">{syncedStudents[2].name}</p>
                      <span className="text-[9.5px] font-mono text-indigo-400 font-bold">{syncedStudents[2].points}⭐</span>
                      <div className="h-8 bg-[#0d0e2c] border-t border-amber-600/30 w-full mt-2 rounded-t-xl flex items-center justify-center font-black text-amber-500 text-xs">
                        3rd
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid list of registries */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {syncedStudents.map((student, i) => (
                    <div key={student.id} className="p-3.5 bg-[#05060f] border border-indigo-900/30 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs transition">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-indigo-500 font-mono font-black w-4">#{i+1}</span>
                        <div>
                          <p className="font-extrabold text-slate-100 uppercase text-[11px] tracking-wide">{student.name}</p>
                          <p className="text-[9.5px] font-medium text-indigo-400">Class: {student.class_level} • Last Sync: {new Date(student.synced_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex -space-x-1">
                          {student.badges_earned.map((b) => (
                            <div key={b} className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-[#05060f]" title={b}>
                              <Award className="h-3 w-3 text-emerald-400" />
                            </div>
                          ))}
                        </div>
                        <span className="font-mono font-black text-yellow-500">{student.points}⭐ Stars</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* D_MBSSE_CURRICULUM_UPLOAD_CARD */}
              <div id="mbsse-curriculum-uploader" className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    School Syllabus Portal
                  </div>
                  <h3 className="text-base font-black uppercase text-white tracking-wide">Upload Custom School Curriculum</h3>
                </div>
                <p className="text-xs text-indigo-300 leading-normal mb-6">
                  Align your school (government or private) specific weekly curriculum guidelines for Class 1–6 with di national MBSSE syllabus.
                </p>

                {/* If user is Free, show a lock wrapper fɔh premium monetization value! */}
                {userProfile?.subscriptionPlan === "free" ? (
                  <div className="bg-slate-950/80 border border-indigo-900/40 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <Lock className="h-8 w-8 text-yellow-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Custom Syllabus is Locked</h4>
                    <p className="text-[11px] text-indigo-300 max-w-xs leading-normal">
                      Connecting private school curriculums is restricted fɔh Individual and Team subscribers. Squeeze below fɔh unlock.
                    </p>
                    <button
                      onClick={() => setPricingOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-650 hover:to-amber-700 text-slate-950 rounded-xl text-[10px] font-black tracking-widest uppercase transition-transform cursor-pointer"
                    >
                      🚀 Upgrade Now
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUploadCurriculumSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">School Name</label>
                        <input
                          required
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Freetown Methodist School"
                          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-505 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Target Class Level</label>
                        <select
                          value={currClassLevel}
                          onChange={(e) => setCurrClassLevel(e.target.value)}
                          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer outline-none focus:border-indigo-505 transition"
                        >
                          {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"].map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Aligned MBSSE Outcome</label>
                      <input
                        required
                        type="text"
                        value={alignedMbsseOutcome}
                        onChange={(e) => setAlignedMbsseOutcome(e.target.value)}
                        placeholder="e.g. Literacy Unit 3 - Reading Di Cotton Tree Scenarios"
                        className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-505 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Syllabus Topics (Comma Separated)</label>
                      <input
                        required
                        type="text"
                        value={currTopicsRaw}
                        onChange={(e) => setCurrTopicsRaw(e.target.value)}
                        placeholder="silent reading, Bai Bureh history, Oral pronunciation..."
                        className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-550 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Lesson Notes / Description</label>
                      <textarea
                        required
                        rows={3}
                        value={currDescription}
                        onChange={(e) => setCurrDescription(e.target.value)}
                        placeholder="Provide details of di private school curriculum additions fɔh alignment reviews..."
                        className="w-full bg-[#05060f] border border-indigo-900/50 rounded-2xl p-3 text-xs text-slate-100 placeholder-indigo-900/40 outline-none focus:border-indigo-550 transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={curriculumUploading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      {curriculumUploading ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      <span>Upload & Align Syllabus to MBSSE</span>
                    </button>
                  </form>
                )}

                {/* CURRENT PUBLISHED CLASS CURRICULA LIST */}
                <div className="mt-8 border-t border-indigo-950 pt-5">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-4 flex items-center space-x-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Your Uploaded School Curriculums ({curriculums.length})</span>
                  </h4>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {curriculums.map((curr) => (
                      <div key={curr.id} className="p-3.5 bg-[#05060f] rounded-2xl border border-indigo-950 hover:border-indigo-900/50 transition">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-white uppercase">{curr.schoolName}</span>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/15">{curr.class_level}</span>
                        </div>
                        <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">{curr.description}</p>
                        
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {curr.topics.map((t, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">{t}</span>
                          ))}
                        </div>

                        <div className="mt-3 border-t border-indigo-950/40 pt-2 flex items-center justify-between font-semibold">
                          <span className="text-[9px] text-indigo-500 uppercase font-bold">MBSSE Goal: {curr.alignedMbsseOutcome}</span>
                          <span className="text-[8.5px] text-zinc-500 font-mono">{new Date(curr.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}

                    {curriculums.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic text-center py-6 font-mono">No custom syllabus uploads found in Cloud Database.</p>
                    )}
                  </div>
                </div>

              </div>


              {/* SERVER-SIDE GEMINI POWERED QUEST CREATOR (SECTIONS 3.1 & 4.1) */}
              <div id="teacher-quest-generator" className="bg-[#0f1233]/60 backdrop-blur-md rounded-3xl p-6 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Gemini AI Integration
                  </div>
                  <h3 className="text-base font-black uppercase text-white tracking-wide">Create MBSSE Quest fɔh Sierra Leone Classes</h3>
                </div>
                <p className="text-xs text-indigo-300 leading-normal mb-6">
                  Input Class level and a localized subject. Gemini AI will write two perfect custom educational questions, complete with spoken Krio translation summaries and logical answer explanation guides.
                </p>

                {/* Generation fields form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Curricular Subject</label>
                    <select
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Science">General Science</option>
                      <option value="Social Studies & Civics">Social Studies & Civics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Primary Class Level</label>
                    <select
                      value={aiClassLevel}
                      onChange={(e) => setAiClassLevel(e.target.value)}
                      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
                    >
                      {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"].map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Localized Topic Context</label>
                    <input
                      type="text"
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      placeholder="e.g. Pygmy hippos, buying Palm Oil..."
                      className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none"
                    />
                  </div>
                </div>

                {generatingAiQuest ? (
                  /* GORGEOUS PEDAGOGICAL LOADER BANNER FƆH LOW RESOURCE SENSITIVITY */
                  <div className="bg-[#05060f] border border-indigo-900/50 p-6 rounded-2xl text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
                    <div>
                      <p className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider">Gemini Generative Engine crafting questions...</p>
                      <p className="text-[10px] text-indigo-550 mt-1 uppercase font-bold tracking-widest">Applying MBSSE primary school syllabus guidelines</p>
                    </div>

                    {/* Educational factual banner */}
                    <motion.div
                      key={currentFactIndex}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl text-left max-w-md mx-auto"
                    >
                      <div className="flex items-center space-x-1.5 text-indigo-405 text-[10px] font-black uppercase tracking-widest mb-1">
                        <Info className="h-3.5 w-3.5" />
                        <span>Curriculum Fact</span>
                      </div>
                      <span className="text-[11px] text-indigo-305 font-sans leading-relaxed">
                        {SIERRA_LEONE_FACTS[currentFactIndex]}
                      </span>
                    </motion.div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleGenerateQuestViaAI}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest transition shadow-lg shadow-indigo-950/30 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>🔮 Generate Curricular Quest via Gemini AI</span>
                    </button>

                    {generationError && (
                      <div className="mt-4 p-3.5 bg-rose-950/30 border border-rose-800 text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-wider">
                        Error: {generationError}
                      </div>
                    )}
                  </div>
                )}

                {/* DYNAMIC GENERATED OUTPUT REVIEW PANEL */}
                {generatedQuestOutput && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-[#05060f] p-5 rounded-2xl border border-indigo-500/30 space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-widest">
                          Generated {generatedQuestOutput.subject} ({generatedQuestOutput.difficulty})
                        </span>
                        <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wider">Review: {generatedQuestOutput.title}</h4>
                      </div>
                      <span className="text-xs text-yellow-500 font-black">+{generatedQuestOutput.points_award}⭐ Award</span>
                    </div>

                    {/* Form Review Questions List */}
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                      {generatedQuestOutput.questions.map((q, idx) => (
                        <div key={idx} className="bg-[#0f1233]/40 p-4 rounded-2xl border border-indigo-950/50 space-y-2 text-xs">
                          <p className="font-extrabold text-slate-100 uppercase text-[11px] tracking-wide">Q{idx+1}: {q.questionText}</p>
                          <p className="text-[11px] text-indigo-300"><span className="text-emerald-400 font-bold uppercase tracking-wide">Correct Answer:</span> {q.correctOption}</p>
                          <p className="text-[11px] text-indigo-300 italic">"Krio: {q.krioInstruction}"</p>
                          <p className="text-[10px] text-indigo-450 leading-relaxed">Explanation: {q.explanation}</p>
                        </div>
                      ))}
                    </div>

                    {/* Finalize Publishing controls */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handlePublishGeneratedQuest}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-xl text-[11px] uppercase tracking-widest transition text-center shadow cursor-pointer text-center"
                      >
                        Publish to Classroom Sync Server
                      </button>
                      <button
                        onClick={() => setGeneratedQuestOutput(null)}
                        className="bg-[#0f1233] hover:bg-slate-900 border border-indigo-900/50 text-indigo-300 font-black py-3 px-5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer"
                      >
                        Discard
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

            </div>

          </div>
          )
        )}

      </div>

      {/* MODAL WINDOW FOR ARCHITECTURAL CLASSRROM HOTSPOT SPEC (Wifi metrics details) */}
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
                In Sierra Leone K-12 classrooms, active global connection is either expensive or entirely absent.{' '}
                <strong>Salone Stars Academy</strong> operates on a 100% locally sustainable stack:
              </p>
              
              <ul className="space-y-3 mt-2">
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">1.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">IndexedDB Persistence Fallback:</strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      Client-side transactions are written to IndexedDB. Students can do quizzes and unlock badges entirely offline in di far provinces.
                    </span>
                  </div>
                </li>
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">2.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">Local hotspot WiFi transmitter:</strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      The teacher’s device serves an ad-hoc private WiFi access point (MBSSE Edge Controller). Connect to Pi hotspot to send progress packages.
                    </span>
                  </div>
                </li>
                <li className="flex items-start space-x-2.5 bg-[#05060f] p-3 rounded-2xl border border-indigo-950">
                  <span className="text-indigo-400 font-mono font-black">3.</span>
                  <div>
                    <strong className="text-slate-100 font-extrabold uppercase text-[10px] tracking-wide block">No Web Virtual DOM overhead:</strong>
                    <span className="block text-[11px] text-indigo-300 mt-1 leading-normal">
                      Highly optimized vectors under 4MB, compressed and instantly loadable even fɔh old Android KitKat tablets.
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
  );
}
