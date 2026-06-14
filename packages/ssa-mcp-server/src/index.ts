#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { loadConfig } from "./config.js"
import { createMcpServer } from "./server.js"

const args = process.argv.slice(2)
const useStdio = args.includes("--stdio")
const useSse = args.includes("--sse")
const portArg = args.find(a => a.startsWith("--port="))
const port = portArg ? parseInt(portArg.split("=")[1], 10) : loadConfig().ssePort

const readBody = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", c => chunks.push(c))
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")) }
      catch (e) { reject(e) }
    })
    req.on("error", reject)
  })

const checkAuth = (req: IncomingMessage, expectedKey: string | undefined): boolean => {
  if (!expectedKey) return true
  const provided = req.headers["x-ssa-api-key"] || req.headers.authorization?.replace(/^Bearer /, "")
  return provided === expectedKey
}

const send401 = (res: ServerResponse) => {
  res.writeHead(401, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ error: "Invalid or missing API key." }))
}

const main = async () => {
  const config = loadConfig()

  if (useSse || (!useStdio && process.env.MCP_TRANSPORT === "sse")) {
    const sseTransports = new Map<string, SSEServerTransport>()
    // Streamable HTTP: one transport per session, keyed by Mcp-Session-Id header
    const streamableTransports = new Map<string, StreamableHTTPServerTransport>()

    const httpServer = createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`)

      // Health check
      if (url.pathname === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ status: "ok", transports: ["sse", "streamable-http"], apiUrl: config.apiUrl }))
        return
      }

      // ── Streamable HTTP transport (MCP spec 2025-03-26) ─────────────────
      if (url.pathname === "/mcp") {
        if (!checkAuth(req, config.sseApiKey)) return send401(res)

        if (req.method === "POST") {
          const sessionId = req.headers["mcp-session-id"] as string | undefined
          let transport: StreamableHTTPServerTransport

          if (sessionId && streamableTransports.has(sessionId)) {
            transport = streamableTransports.get(sessionId)!
          } else {
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => crypto.randomUUID(),
            })
            const mcpServer = createMcpServer(config)
            await mcpServer.connect(transport)
            if (transport.sessionId) {
              streamableTransports.set(transport.sessionId, transport)
              transport.onclose = () => streamableTransports.delete(transport.sessionId!)
            }
          }

          try {
            const body = await readBody(req)
            await transport.handleRequest(req, res, body)
          } catch {
            if (!res.headersSent) {
              res.writeHead(400, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: "Invalid JSON body." }))
            }
          }
          return
        }

        if (req.method === "GET" || req.method === "DELETE") {
          const sessionId = req.headers["mcp-session-id"] as string | undefined
          const transport = sessionId ? streamableTransports.get(sessionId) : undefined
          if (!transport) {
            res.writeHead(404, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Session not found." }))
            return
          }
          await transport.handleRequest(req, res)
          return
        }

        res.writeHead(405).end("Method Not Allowed")
        return
      }

      // ── Legacy SSE transport ─────────────────────────────────────────────
      if (url.pathname === "/sse" && req.method === "GET") {
        if (!checkAuth(req, config.sseApiKey)) return send401(res)

        const mcpServer = createMcpServer(config)
        const transport = new SSEServerTransport("/message", res)
        sseTransports.set(transport.sessionId, transport)
        res.on("close", () => sseTransports.delete(transport.sessionId))
        await mcpServer.connect(transport)
        await transport.start()
        return
      }

      if (url.pathname === "/message" && req.method === "POST") {
        const sessionId = url.searchParams.get("sessionId")
        if (!sessionId) { res.writeHead(400).end("Missing sessionId"); return }
        const transport = sseTransports.get(sessionId)
        if (!transport) { res.writeHead(404).end("Session not found"); return }
        const body = await readBody(req)
        await transport.handlePostMessage(req, res, body)
        return
      }

      res.writeHead(404).end("Not found")
    })

    httpServer.listen(port, () => {
      console.error(`[SSA MCP] HTTP server on port ${port}`)
      console.error(`  Streamable HTTP: POST http://0.0.0.0:${port}/mcp  (MCP spec 2025-03-26)`)
      console.error(`  Legacy SSE:      GET  http://0.0.0.0:${port}/sse`)
    })
    return
  }

  // ── stdio transport (default) ──────────────────────────────────────────
  const mcpServer = createMcpServer(config)
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error("[SSA MCP] stdio transport ready")
}

main().catch(err => {
  console.error("[SSA MCP] Fatal:", err)
  process.exit(1)
})
