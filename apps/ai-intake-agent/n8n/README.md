# n8n – AI Intake Agent

Bestand: workflows/ai-intake-agent.json

Flow: Webhook → Extract lead data → Gmail → Notion (lead in DB) → Respond.

Na import: Gmail- en Notion-credentials instellen; bij Notion je database kiezen.

Workflow vervangen via API: X-N8N-API-KEY + PUT /api/v1/workflows/{id}. MCP kan niet create/update.
