# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Turborepo monorepo (`pnpm@9.0.0`, Node >= 18) with 4 Next.js apps and 3 shared packages. See root `README.md` for general Turborepo usage.

| App               | Port | Notes                                                                                                                            |
| ----------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| `command-center`  | 3000 | Notion-backed dashboard (Next.js 14). Needs `NOTION_API_KEY` + 5 DB IDs in `.env.local`. Renders static data without valid keys. |
| `ai-intake-agent` | 3002 | Intake form + PostgreSQL (Next.js 14, Prisma). Fully functional locally with local PG.                                           |
| `web`             | 3000 | Turborepo template (Next.js 16).                                                                                                 |
| `docs`            | 3001 | Turborepo template (Next.js 16).                                                                                                 |

### Running services

- **PostgreSQL** must be running for `ai-intake-agent`. Start with: `sudo service postgresql start`
- **Prisma**: After first install or schema changes, run `pnpm db:generate && pnpm db:push` inside `apps/ai-intake-agent`. Prisma reads `DATABASE_URL` from `.env` (not `.env.local`), so both files must exist or be symlinked.
- Dev servers: `pnpm dev` from root runs all apps, or use `pnpm --filter <app> dev` for individual apps.

### Known pre-existing issues

- **`web` and `docs` build failures**: Both template apps have a TypeScript error (`The inferred type of 'RootLayout' cannot be named without a reference to @types/react`). This is a React 19 / @types/react version mismatch in Next.js 16. Does not affect dev mode.
- **`command-center` build failure**: `productivity-chart.tsx` has a Recharts `formatter` type mismatch. Does not affect dev mode.
- **`ai-intake-agent` lint**: `next lint` does not auto-detect the flat ESLint config (`eslint.config.js`). Run `pnpm turbo lint --filter='!@legendary/ai-intake-agent'` to lint all other packages, or run `npx eslint .` directly inside `apps/ai-intake-agent` to use the flat config.

### Lint / build / dev commands

Standard commands from root (see `package.json`):

- `pnpm lint` — lint all packages (see known issue above for ai-intake-agent)
- `pnpm build` — build all (see known issues above)
- `pnpm dev` — run all dev servers
- `pnpm check-types` — TypeScript type checking
- `pnpm format` — Prettier formatting

### Environment variables

- `apps/command-center/.env.local` — Notion API credentials (see `.env.example`)
- `apps/ai-intake-agent/.env` and `.env.local` — `DATABASE_URL`, `ADMIN_SECRET`, `ADMIN_PASSWORD` (see `apps/ai-intake-agent/README.md`)

### Pre-commit hooks

Husky + lint-staged runs on pre-commit (`.husky/pre-commit`). This runs Prettier/ESLint on staged files.
