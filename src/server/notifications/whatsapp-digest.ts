/**
 * Phase 7 — WhatsApp weekly digest delivery (stub).
 * Wire to Twilio/Meta Business API when notification service is provisioned.
 * Reads parent profiles with digestOptIn + whatsappPhone from Firestore Admin SDK.
 */
export type DigestPayload = {
  parentId: string
  phone: string
  childName: string
  streak: number
  subjectsThisWeek: string[]
  weakAreas: string[]
}

export const formatWeeklyDigestMessage = (payload: DigestPayload): string => {
  const subjects = payload.subjectsThisWeek.length > 0
    ? payload.subjectsThisWeek.join(", ")
    : "none yet"
  const weak = payload.weakAreas.length > 0
    ? payload.weakAreas.join(", ")
    : "none flagged"
  return [
    `Salone Stars Academy — weekly update for ${payload.childName}`,
    `Streak: ${payload.streak} days`,
    `Subjects: ${subjects}`,
    `Needs practice: ${weak}`,
    "Open the app for full digest.",
  ].join("\n")
}

export const sendWeeklyDigest = async (_payload: DigestPayload): Promise<{ queued: boolean }> => {
  // TODO Phase 7: integrate Twilio WhatsApp or Meta Cloud API
  console.log("[notifications] WhatsApp digest stub — message not sent (service not configured)")
  return { queued: false }
}
