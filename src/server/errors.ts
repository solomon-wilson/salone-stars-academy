import type { Response } from "express"

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL"

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const sendError = (res: Response, code: ApiErrorCode, message: string, status: number, details?: Record<string, unknown>) => {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } }
  return res.status(status).json(body)
}

export const sendApiError = (res: Response, err: ApiError) =>
  sendError(res, err.code, err.message, err.status, err.details)

export const handleRouteError = (res: Response, err: unknown, fallback = "Internal server error.") => {
  if (err instanceof ApiError) return sendApiError(res, err)
  console.error("[API]", err)
  return sendError(res, "INTERNAL", fallback, 500)
}
