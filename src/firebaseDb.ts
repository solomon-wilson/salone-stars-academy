import { db, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error("[Firestore Failure Handler]:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  role: "teacher" | "pupil" | "parent";
  subscriptionPlan: "free" | "individual" | "team";
  stripeCustomerId?: string;
  stripeSubscriptionStatus?: string;
  createdAt: string;
}

export interface FirestorePupil {
  id: string;
  name: string;
  class_level: string;
  points: number;
  streak_count: number;
  last_active_date: string;
  badges_earned: string[];
  teacherId?: string;
  parentId?: string;
  synced_at: number;
}

export interface FirestoreQuest {
  id: string;
  title: string;
  subject: string;
  class_level: string;
  points_award: number;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: any[];
  source: "default" | "generated";
  teacherId?: string;
  alignedMbsseOutcome?: string;
}

export interface FirestoreParentNote {
  parentId: string;
  weekKey: string;
  topics: string;
  updatedAt: string;
}

export interface FirestoreCurriculum {
  id: string;
  teacherId: string;
  class_level: string;
  schoolName: string;
  alignedMbsseOutcome: string;
  topics: string[];
  description: string;
  updatedAt: string;
}

export async function getProfile(uid: string): Promise<FirestoreUser | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createProfile(
  uid: string,
  email: string,
  name: string,
  role: "teacher" | "pupil" | "parent"
): Promise<FirestoreUser> {
  const path = `users/${uid}`;
  const newUser: FirestoreUser = {
    uid,
    email,
    name,
    role,
    subscriptionPlan: "free",
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateProfile(uid: string, data: Partial<FirestoreUser>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncPupil(pupil: FirestorePupil): Promise<void> {
  const path = `pupils/${pupil.id}`;
  try {
    const docRef = doc(db, "pupils", pupil.id);
    await setDoc(docRef, pupil);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getPupilsForTeacher(teacherId: string): Promise<FirestorePupil[]> {
  const path = "pupils";
  try {
    const q = query(collection(db, "pupils"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FirestorePupil);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getPupilsForParent(parentId: string): Promise<FirestorePupil[]> {
  const path = "pupils";
  try {
    const q = query(collection(db, "pupils"), where("parentId", "==", parentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FirestorePupil);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function linkChildToParent(pupil: FirestorePupil): Promise<void> {
  const path = `pupils/${pupil.id}`;
  try {
    const docRef = doc(db, "pupils", pupil.id);
    await setDoc(docRef, pupil);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveParentWeeklyNote(note: FirestoreParentNote): Promise<void> {
  const docId = `${note.parentId}_${note.weekKey}`;
  const path = `parent_notes/${docId}`;
  try {
    const docRef = doc(db, "parent_notes", docId);
    await setDoc(docRef, note);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getParentWeeklyNote(
  parentId: string,
  weekKey: string
): Promise<FirestoreParentNote | null> {
  const docId = `${parentId}_${weekKey}`;
  const path = `parent_notes/${docId}`;
  try {
    const docRef = doc(db, "parent_notes", docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as FirestoreParentNote;
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createQuest(quest: FirestoreQuest): Promise<void> {
  const path = `quests/${quest.id}`;
  try {
    const docRef = doc(db, "quests", quest.id);
    await setDoc(docRef, quest);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getQuests(): Promise<FirestoreQuest[]> {
  const path = "quests";
  try {
    const snap = await getDocs(collection(db, "quests"));
    return snap.docs.map(d => d.data() as FirestoreQuest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function uploadCurriculum(curriculum: FirestoreCurriculum): Promise<void> {
  const path = `curriculums/${curriculum.id}`;
  try {
    const docRef = doc(db, "curriculums", curriculum.id);
    await setDoc(docRef, curriculum);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getCurriculums(teacherId: string): Promise<FirestoreCurriculum[]> {
  const path = "curriculums";
  try {
    const q = query(collection(db, "curriculums"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FirestoreCurriculum);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
