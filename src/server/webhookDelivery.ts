import crypto from "crypto"
import { getFirestoreAdmin } from "./firebaseAdmin"

export type WebhookEvent =
  | "quest.published"
  | "pupil.synced"
  | "homework.published"
  | "api_key.created"
  | "api_key.revoked"

interface WebhookRecord {
  id: string
  ownerUid: string
  url: string
  events: string[]
  secret: string
  active: boolean
}

const sign = (payload: string, secret: string): string => {
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

const deliver = async (url: string, event: WebhookEvent, payload: unknown, secret: string): Promise<void> => {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })
  const sig = sign(body, secret)
  const delays = [5_000, 25_000, 125_000]

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SSA-Signature": sig,
          "X-SSA-Event": event,
          "X-SSA-Delivery-Attempt": String(attempt + 1),
        },
        body,
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) return
      if (res.status < 500) return
    } catch {
      /* network error — retry */
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, delays[attempt]))
  }
}

export const deliverWebhook = async (event: WebhookEvent, payload: unknown, ownerUid: string): Promise<void> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return

  try {
    const snap = await firestore
      .collection("webhooks")
      .where("ownerUid", "==", ownerUid)
      .where("active", "==", true)
      .get()

    for (const doc of snap.docs) {
      const wh = doc.data() as WebhookRecord
      if (!wh.events.includes(event)) continue
      deliver(wh.url, event, payload, wh.secret).catch(err =>
        console.error(`[Webhook] delivery failed for ${wh.id}:`, err)
      )
    }
  } catch (err) {
    console.error("[Webhook] lookup failed:", err)
  }
}
