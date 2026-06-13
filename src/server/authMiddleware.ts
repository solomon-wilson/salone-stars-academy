import { Request, Response, NextFunction } from "express"
import { verifyIdToken } from "./firebaseAdmin"

export interface AuthenticatedRequest extends Request {
  firebaseUser?: { uid: string; email?: string }
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Provide a Firebase ID token." })
  }

  const token = authHeader.slice(7)
  const decoded = await verifyIdToken(token)
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired authentication token." })
  }

  req.firebaseUser = { uid: decoded.uid, email: decoded.email }
  next()
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    const decoded = await verifyIdToken(authHeader.slice(7))
    if (decoded) {
      req.firebaseUser = { uid: decoded.uid, email: decoded.email }
    }
  }
  next()
}
