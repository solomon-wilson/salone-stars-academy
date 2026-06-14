import type { DatabaseManager } from "../../dbManager"
import type Stripe from "stripe"

export interface ServerDeps {
  db: DatabaseManager
  getStripe: () => Stripe | null
}
