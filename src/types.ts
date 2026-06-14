export interface Question {
  questionText: string;
  options: string[];
  correctOption: string;
  explanation: string;
  krioInstruction: string;
}

export interface Quest {
  id: string;
  title: string;
  subject: string;
  class_level: string;
  points_award: number;
  difficulty: string;
  questions: Question[];
  source: "default" | "generated" | "bank" | "parent-pack";
  teacherId?: string;
  alignedMbsseOutcome?: string;
}

export interface SholaMessage {
  role: "shola" | "pupil";
  content: string;
  timestamp: string;
  xpAwarded?: number;
}

export interface PupilProfile {
  id: string;
  name: string;
  class_level: string;
  points: number;
  streak_count: number;
  last_active_date: string;
  badges_earned: string[];
  streak_freezes: number;
}

export interface SyncedStudent {
  id: string;
  name: string;
  class_level: string;
  points: number;
  streak_count: number;
  last_active_date: string;
  badges_earned: string[];
  synced_at: number;
  teacherId?: string;
  parentId?: string;
}

export interface SyncLog {
  id: string;
  timestamp: number;
  pupil_name: string;
  delta_points: number;
  event_type: string;
}

export interface Curriculum {
  id: string;
  teacherId: string;
  class_level: string;
  schoolName: string;
  alignedMbsseOutcome: string;
  topics: string[];
  description: string;
  updatedAt: string;
}

export interface ParentWeeklyNote {
  parentId: string;
  weekKey: string;
  topics: string;
  updatedAt: string;
}

export type UserRole = "teacher" | "pupil" | "parent";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionPlan: "free" | "individual" | "team";
  stripeCustomerId?: string;
  stripeSubscriptionStatus?: string;
  createdAt: string;
  whatsappPhone?: string;
  digestOptIn?: boolean;
}
