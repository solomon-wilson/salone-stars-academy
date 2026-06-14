import { Router } from "express"
import { generateOpenApiDocument } from "../../api/openapi"

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Salone Stars Academy API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" })
  </script>
</body>
</html>`

export const createDocsRouter = () => {
  const router = Router()

  router.get("/api/openapi.json", (_req, res) => {
    res.json(generateOpenApiDocument())
  })

  router.get("/api/docs", (_req, res) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' https://unpkg.com; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com")
    res.type("html").send(SWAGGER_HTML)
  })

  return router
}
