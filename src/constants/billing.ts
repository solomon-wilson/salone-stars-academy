/**
 * Billing constants for parent value messaging.
 * Mobile money integration (Orange Money, Afrimoney) is Phase 7 — Stripe card checkout remains v1 default.
 * Research: evaluate Stripe local payment methods for SL or Paystack/Flutterwave regional partners.
 */
export const BILLING_COPY = {
  sllFootnote: "Approx. Le 450,000/month at current rates — one subscription covers up to 3 children.",
  mobileMoneyNote:
    "Card checkout available now. Orange Money and Afrimoney support planned — contact support if you need help paying.",
  parentBullets: [
    "Daily MBSSE-aligned homework path",
    "Up to 3 child profiles on one plan",
    "AI homework from weekly school topics",
    "Offline practice with progress digest",
  ],
} as const
