# AI Intake Agent

AI-powered intake for MKB (small/medium business): landing page, form → LiteLLM categorization → PostgreSQL → n8n notifications.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Backend:** API routes + Prisma, PostgreSQL
- **AI:** LiteLLM (OpenAI-compatible) → local Ollama or OpenAI
- **Automation:** n8n webhook for email/Notion

## Quick start

### 1. Environment

```bash
cp .env.example .env.local
# Edit .env.local: DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET
```

**Prisma en DATABASE_URL:** Prisma CLI (`generate`, `db push`) leest standaard uit `.env`, niet `.env.local`. Gebruik één van:

- Maak `.env` aan met dezelfde inhoud als `.env.local`, of
- Symlink: `ln -sf .env.local .env`
- Of: `dotenv -e .env.local -- pnpm prisma generate`

Required:

- `DATABASE_URL` – PostgreSQL connection string (e.g. from AI-Automation-Studio or own DB)
- `ADMIN_SECRET` – random string for admin session cookie: `openssl rand -hex 32`
- `ADMIN_PASSWORD` – password for `/admin` dashboard

Optional:

- `LITELLM_URL` – default `http://localhost:4000`
- `N8N_WEBHOOK_URL` – default `https://n8n.matmat.me/webhook/intake`

### 2. Database

```bash
pnpm db:generate
pnpm db:push
```

### 3. Run

From monorepo root:

```bash
pnpm --filter @legendary/ai-intake-agent dev
```

Or from this app:

```bash
pnpm dev
```

App: **http://localhost:3002**

- **Landing + form:** `/`
- **Admin (leads table, filters, status):** `/admin` (login with `ADMIN_PASSWORD`)

## Flow

1. User fills form (Naam, Email, Bedrijf, Type vraag, Omschrijving).
2. `POST /api/submit` validates → calls LiteLLM (category + urgency) → saves lead in PostgreSQL → calls n8n webhook.
3. n8n workflow (on n8n.matmat.me) can send email to owner, confirmation to customer, create Notion page.

## n8n workflow

- Webhook path: `POST /webhook/intake`
- Payload: `{ leadId, name, email, company, category, urgency }`

A minimal workflow JSON is in `n8n/workflows/ai-intake-agent.json`. Import it in n8n and add your Gmail/Notion nodes after “Extract lead data”.

## Scripts

| Command            | Description             |
| ------------------ | ----------------------- |
| `pnpm dev`         | Next.js dev (port 3002) |
| `pnpm build`       | Production build        |
| `pnpm db:generate` | Prisma generate         |
| `pnpm db:push`     | Push schema to DB       |
| `pnpm type-check`  | TypeScript check        |

## File structure

```
apps/ai-intake-agent/
├── app/
│   ├── page.tsx           # Landing + intake form
│   ├── admin/page.tsx     # Admin dashboard (password-protected)
│   └── api/
│       ├── submit/route.ts   # Form → AI → DB → n8n
│       ├── leads/route.ts    # GET leads (admin)
│       ├── leads/[id]/route.ts # PATCH lead status
│       └── admin/login, logout
├── components/
│   ├── intake-form.tsx
│   ├── lead-table.tsx
│   └── ui/
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # Admin cookie auth
│   ├── litellm.ts         # LiteLLM helper
│   └── types.ts
├── prisma/schema.prisma
└── n8n/workflows/ai-intake-agent.json
```

## Deploy (matmat.me)

- Build: `pnpm build`
- Run with `DATABASE_URL`, `ADMIN_SECRET`, `ADMIN_PASSWORD` and optional `N8N_WEBHOOK_URL` set in the host environment or Caddy/Docker env.
