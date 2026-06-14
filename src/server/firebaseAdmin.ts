import admin from "firebase-admin"
import { getFirestore, FieldValue } from "firebase-admin/firestore"

export { FieldValue }

let initialized = false

export const getFirebaseAdmin = (): admin.app.App | null => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
  if (!projectId) return null

  if (!initialized) {
    try {
      admin.initializeApp({ projectId })
      initialized = true
      console.log("[Firebase Admin] Initialized for project:", projectId)
    } catch (error) {
      console.error("[Firebase Admin] Init failed:", error)
      return null
    }
  }
  return admin.app()
}

export const getFirestoreAdmin = () => {
  const app = getFirebaseAdmin()
  if (!app) return null
  const databaseId = process.env.FIREBASE_DATABASE_ID
  if (databaseId) {
    return getFirestore(app, databaseId)
  }
  return getFirestore(app)
}

export const updateUserSubscription = async (
  userId: string,
  plan: "individual" | "team",
  stripeCustomerId?: string,
  stripeSubscriptionStatus?: string
): Promise<boolean> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) {
    console.warn("[Firebase Admin] Firestore unavailable — subscription not updated for", userId)
    return false
  }

  const updateData: Record<string, string> = { subscriptionPlan: plan }
  if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId
  if (stripeSubscriptionStatus) updateData.stripeSubscriptionStatus = stripeSubscriptionStatus

  await firestore.collection("users").doc(userId).update(updateData)
  console.log(`[Billing] Updated user ${userId} subscription to ${plan}`)
  return true
}

export const verifyIdToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
  const app = getFirebaseAdmin()
  if (!app) return null
  try {
    return await admin.auth(app).verifyIdToken(token)
  } catch {
    return null
  }
}
