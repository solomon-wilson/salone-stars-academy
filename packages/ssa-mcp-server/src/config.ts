export interface SsaConfig {
  apiUrl: string
  apiKey?: string
  firebaseToken?: string
  ssePort: number
  sseApiKey?: string
}

export const loadConfig = (): SsaConfig => {
  const apiUrl = (process.env.SSA_API_URL || "http://localhost:3000").replace(/\/$/, "")
  return {
    apiUrl,
    apiKey: process.env.SSA_API_KEY,
    firebaseToken: process.env.SSA_FIREBASE_TOKEN,
    ssePort: parseInt(process.env.MCP_SSE_PORT || "3100", 10),
    sseApiKey: process.env.MCP_SSE_API_KEY || process.env.SSA_API_KEY,
  }
}

export const hasAuth = (config: SsaConfig): boolean =>
  Boolean(config.apiKey || config.firebaseToken)
