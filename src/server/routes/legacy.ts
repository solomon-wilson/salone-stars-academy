import type { RequestHandler } from "express"

export const deprecationMiddleware: RequestHandler = (req, res, next) => {
  res.setHeader("Deprecation", "true")
  res.setHeader("Sunset", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString())
  const v1Path = req.originalUrl.replace(/^\/api\//, "/api/v1/")
  res.setHeader("Link", `<${v1Path}>; rel="successor-version"`)
  next()
}
