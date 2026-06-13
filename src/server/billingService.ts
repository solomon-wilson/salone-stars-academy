import Stripe from "stripe"
import { updateUserSubscription, getFirestoreAdmin } from "./firebaseAdmin"

export const handleCheckoutCompleted = async (
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> => {
  const userId = session.metadata?.userId || session.client_reference_id
  const plan = session.metadata?.plan as "individual" | "team" | undefined

  if (!userId || !plan) {
    console.warn("[Billing Webhook] Missing userId or plan in session metadata")
    return
  }

  await updateUserSubscription(
    userId,
    plan,
    typeof session.customer === "string" ? session.customer : undefined,
    "active"
  )
}

export const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const firestore = await import("./firebaseAdmin").then(m => m.getFirestoreAdmin())
  if (!firestore) return

  await firestore.collection("users").doc(userId).update({
    subscriptionPlan: "free",
    stripeSubscriptionStatus: "cancelled",
  })
  console.log(`[Billing Webhook] Downgraded user ${userId} to free`)
}

export const handlePaymentFailed = async (
  invoice: Stripe.Invoice
): Promise<void> => {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null
  if (!customerId) return

  const firestore = getFirestoreAdmin()
  if (!firestore) return

  const snap = await firestore.collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get()

  if (snap.empty) {
    console.warn(`[Billing Webhook] No user found for customer ${customerId}`)
    return
  }

  await snap.docs[0].ref.update({ stripeSubscriptionStatus: "past_due" })
  console.log(`[Billing Webhook] Payment failed — user ${snap.docs[0].id} marked past_due`)
}

export const processBillingSuccessRedirect = async (
  userId: string,
  plan: string,
  sessionId?: string,
  stripe?: Stripe | null
): Promise<boolean> => {
  if (!userId || !plan) return false
  const validPlan = plan === "team" ? "team" : "individual"

  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status !== "paid" && session.status !== "complete") {
        console.warn("[Billing] Session not paid:", sessionId)
        return false
      }
    } catch (error) {
      console.error("[Billing] Session verification failed:", error)
      return false
    }
  }

  return updateUserSubscription(userId, validPlan, undefined, "active")
}
