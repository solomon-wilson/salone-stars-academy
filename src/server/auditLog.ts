import { getFirestoreAdmin, FieldValue } from "./firebaseAdmin"

export interface AuditEntry {
  actorUid: string
  actorType: "firebase" | "api_key"
  action: string
  resource: string
  resourceId?: string
  ip?: string
  userAgent?: string
  requestId?: string
  success: boolean
  keyId?: string
}

export const writeAuditLog = async (entry: AuditEntry): Promise<void> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return

  try {
    await firestore.collection("audit_logs").add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error("[AuditLog] write failed:", err)
  }
}
