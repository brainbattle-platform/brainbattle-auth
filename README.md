# BrainBattle — Auth Context Service

Overview

This service verifies Supabase access tokens and exposes an identity endpoint used by other services. It does not implement full signup/login flows; it provides authenticated user context (profile, roles, learner_profile) via Prisma.

---

Architecture / Flow

- Token verification: `src/auth-context/services/supabase-auth.service.ts` (Supabase client)
- Guard: `src/auth-context/guards/supabase-auth.guard.ts` (validates Bearer token and populates `req.user`)
- Controller: `src/auth-context/auth.controller.ts` — `GET /auth/me` (reads `profile`, `userRole`, `learnerProfile` from database via Prisma)
- Database: Prisma ORM with `prisma/schema.prisma` (datasource from `DATABASE_URL`)

---

Project structure (important parts)

- `src/` — application source
  - `auth-context/` — auth-related controller, guard, services
  - `prisma.module.ts`, `prisma.service.ts` — Prisma integration
  - other modules: `profiles/`, `roles/`, `wallets/`, `learner-profiles/`, `admin-users/`
- `prisma/` — schema and migrations
- `scripts/` — helper scripts (e.g. `scripts/get-token.js`)
- `docker-compose.yml` — local PostgreSQL service (exposes host port 5433)

---

Installation & Run

Requirements

- Node.js 18+ and npm
- PostgreSQL (accessible via `DATABASE_URL`) or use the included Docker Compose for a local DB

Quick start (development)

```bash
npm install
cp .env.example .env
docker compose up -d         # optional: starts local Postgres on port 5433
npm run prisma:generate
npm run prisma:migrate       # run migrations for local dev if needed
npm run start:dev
```

Production build

```bash
npm run build
npm run start
```

---

Environment variables (key)

- `PORT` — application port (default: 3000)
- `DATABASE_URL` — Prisma datasource URL (Postgres)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key (used by Supabase client)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (optional)
- `NODE_ENV` — environment

See `.env.example` for a template.

---

Important scripts

- `npm run start:dev` — start NestJS in watch mode
- `npm run start` — start production (built) app
- `npm run build` — compile TypeScript
- `npm run prisma:generate` / `prisma:migrate` / `prisma:studio` — Prisma tooling

---

Dependencies / External services

- Primary runtime dependencies used by code: Supabase (token verification) and PostgreSQL (Prisma)
- Other packages are present in `package.json` (Passport, Nodemailer, OAuth providers), but not all are actively used by the `auth-context` controller.

---

Notes

- The codebase contains additional documentation in the `docs/` folder describing broader auth flows; not all described flows are implemented in `src/`.
- Keep `.env` values up-to-date before running migrations or the server.