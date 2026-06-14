import path from "path"
import dotenv from "dotenv"
import express from "express"
import { createApp } from "./src/server/app"

dotenv.config()

const app = createApp()
const PORT = 3000

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite")
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), "dist")
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "365d",
      immutable: true,
      fallthrough: false,
    }))
    app.get("/manifest.json", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      res.sendFile(path.join(distPath, "manifest.json"))
    })
    app.get("/sw.js", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      res.sendFile(path.join(distPath, "sw.js"))
    })
    app.use(express.static(distPath, { maxAge: "1d" }))
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"))
    })
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Salone Stars Academy server started on http://localhost:${PORT}`)
  })
}

export { app }

if (!process.env.VERCEL) {
  startServer()
}
