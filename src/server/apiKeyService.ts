import crypto from "crypto"
import { getFirestoreAdmin } from "./firebaseAdmin"

export interface ApiKeyRecord {
  id: string
  ownerUid: string
  name: string
  prefix: string
  secretHash: string
  scopes: string[]
  allowedPupilIds?: string[]
  rateLimitPerHour: number
  expiresAt?: string
  revokedAt?: string
  createdAt: string
}

const hashSecret = (secret: string) =>
  crypto.createHash("sha256").update(secret).digest("hex")

const generateSecret = () => {
  const raw = crypto.randomBytes(24).toString("base64url")
  return `ssa_live_${raw}`
}

export const createApiKey = async (
  ownerUid: string,
  name: string,
  scopes: string[],
  rateLimitPerHour = 1000
): Promise<{ keyId: string; secret: string; prefix: string }> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) throw new Error("Firestore unavailable — cannot create API key.")

  const secret = generateSecret()
  const prefix = secret.slice(0, 16)
  const keyId = crypto.randomUUID()

  const record: ApiKeyRecord = {
    id: keyId,
    ownerUid,
    name,
    prefix,
    secretHash: hashSecret(secret),
    scopes,
    rateLimitPerHour,
    createdAt: new Date().toISOString(),
  }

  await firestore.collection("api_keys").doc(keyId).set(record)
  return { keyId, secret, prefix }
}

export const listApiKeys = async (ownerUid: string): Promise<Omit<ApiKeyRecord, "secretHash">[]> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return []

  const snap = await firestore
    .collection("api_keys")
    .where("ownerUid", "==", ownerUid)
    .get()

  return snap.docs.map(d => {
    const { secretHash: _, ...rest } = d.data() as ApiKeyRecord
    return rest
  })
}

export const revokeApiKey = async (ownerUid: string, keyId: string): Promise<boolean> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return false

  const ref = firestore.collection("api_keys").doc(keyId)
  const snap = await ref.get()
  if (!snap.exists || snap.data()?.ownerUid !== ownerUid) return false

  await ref.update({ revokedAt: new Date().toISOString() })
  return true
}

export const verifyApiKey = async (secret: string): Promise<ApiKeyRecord | null> => {
  if (!secret.startsWith("ssa_live_")) return null

  const firestore = getFirestoreAdmin()
  if (!firestore) return null

  const prefix = secret.slice(0, 16)
  const snap = await firestore
    .collection("api_keys")
    .where("prefix", "==", prefix)
    .limit(1)
    .get()

  if (snap.empty) return null

  const record = snap.docs[0].data() as ApiKeyRecord
  if (record.revokedAt) return null
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) return null
  if (record.secretHash !== hashSecret(secret)) return null

  return { ...record, id: snap.docs[0].id }
}

export const rotateApiKey = async (
  ownerUid: string,
  keyId: string,
): Promise<{ keyId: string; secret: string; prefix: string } | null> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return null

  const oldRef = firestore.collection("api_keys").doc(keyId)
  const oldSnap = await oldRef.get()
  if (!oldSnap.exists || oldSnap.data()?.ownerUid !== ownerUid) return null

  const old = oldSnap.data() as ApiKeyRecord
  if (old.revokedAt) return null

  const newSecret = generateSecret()
  const newPrefix = newSecret.slice(0, 16)
  const newKeyId = crypto.randomUUID()

  const newRecord: ApiKeyRecord = {
    id: newKeyId,
    ownerUid,
    name: old.name,
    prefix: newPrefix,
    secretHash: hashSecret(newSecret),
    scopes: old.scopes,
    ...(old.allowedPupilIds ? { allowedPupilIds: old.allowedPupilIds } : {}),
    rateLimitPerHour: old.rateLimitPerHour,
    ...(old.expiresAt ? { expiresAt: old.expiresAt } : {}),
    createdAt: new Date().toISOString(),
  }

  const batch = firestore.batch()
  batch.set(firestore.collection("api_keys").doc(newKeyId), newRecord)
  batch.update(oldRef, { revokedAt: new Date().toISOString() })
  await batch.commit()

  return { keyId: newKeyId, secret: newSecret, prefix: newPrefix }
}

export const countParentLinkedChildren = async (parentId: string): Promise<number> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return 0

  const snap = await firestore
    .collection("pupils")
    .where("parentId", "==", parentId)
    .get()

  return snap.size
}

export const isPupilLinkedToParent = async (parentId: string, pupilId: string): Promise<boolean> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return false

  const snap = await firestore.collection("pupils").doc(pupilId).get()
  if (!snap.exists) return false
  return snap.data()?.parentId === parentId
}

export const isPupilOwnedByTeacher = async (teacherId: string, pupilId: string): Promise<boolean> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) {
    const { DatabaseManager } = await import("../dbManager")
    const { students } = await DatabaseManager.getInstance().getStudentsAndLogs()
    return students.some(s => s.id === pupilId && s.teacherId === teacherId)
  }

  const snap = await firestore.collection("pupils").doc(pupilId).get()
  if (!snap.exists) return false
  return snap.data()?.teacherId === teacherId
}
