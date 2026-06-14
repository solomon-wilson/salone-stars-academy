import type { SsaConfig } from "./config"

export interface ApiErrorBody {
  error?: { code?: string; message?: string; retryAfter?: number }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public retryAfter?: number,
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

export class SsaApiClient {
  constructor(private config: SsaConfig) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    const token = this.config.apiKey || this.config.firebaseToken
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }

  private parseError(body: ApiErrorBody, fallback: string, status: number): ApiClientError {
    const err = body?.error
    return new ApiClientError(
      err?.message || fallback,
      err?.code || "INTERNAL",
      status,
      err?.retryAfter,
    )
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.config.apiUrl}${path}`, { headers: this.headers() })
    const body = await res.json()
    if (!res.ok) throw this.parseError(body, `GET ${path} failed: ${res.status}`, res.status)
    return body as T
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.config.apiUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) throw this.parseError(body, `POST ${path} failed: ${res.status}`, res.status)
    return body as T
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.config.apiUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    })
    const body = await res.json()
    if (!res.ok) throw this.parseError(body, `DELETE ${path} failed: ${res.status}`, res.status)
    return body as T
  }
}
