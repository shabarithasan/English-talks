# English Talks Platform

This repository is a clean-room implementation for `English Talks`, an AI-driven English speaking practice platform with a real backend and persistent user database.

## What's included

- `apps/web`: Next.js marketing site and learner app shell
- `apps/api`: Express + TypeScript API with Prisma, SQLite persistence, auth, profile management, courses, practice, assessment, and Stripe webhook placeholder handling
- `packages/shared`: shared product metadata, routes, and domain types
- `docs`: implementation architecture, backlog, and developer handoff material
- `apps/api/prisma/schema.prisma`: relational schema for the proposed platform
- `.github/workflows/ci.yml`: GitHub Actions build and typecheck pipeline
- `LICENSE`: MIT license

## Quick start

```bash
npm install
npm run dev
```

This starts:

- frontend on `http://localhost:3000`
- API on `http://localhost:4000`

## Workspace scripts

```bash
npm run dev
npm run build
npm run typecheck
```

## Environment

Copy `.env.example` values into local environment files as needed:

- `apps/web/.env.local`
- `apps/api/.env`

## Database modes

The backend now supports two database modes:

1. Local SQLite for development
2. Turso cloud SQLite for free hosted storage

Local mode:

```env
DATABASE_URL=file:./english-talks.db
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Turso mode:

```env
DATABASE_URL=file:./english-talks.db
TURSO_DATABASE_URL=libsql://your-db-name-your-user.turso.io
TURSO_AUTH_TOKEN=your_turso_token
```

When `TURSO_DATABASE_URL` is set, the API runtime uses Turso automatically.

## Product coverage

The starter includes routes and content scaffolding for:

- home, about, business, schools
- IELTS speaking and writing
- mock interview
- level test
- vocabulary booster
- program listing and learner dashboard shell

## Current backend coverage

1. Registration and login with hashed passwords.
2. Persistent user profile storage in SQLite through Prisma.
3. Profile update and password change endpoints.
4. Persistent speaking session, transcript, and assessment records.
5. Optional Turso-backed cloud persistence for the same Prisma models.

## Deployment

Production deployment guidance for Vercel + Turso is documented in [docs/deployment-vercel-turso.md](/C:/Users/shaba/OneDrive/Documents/English speech pratices app/docs/deployment-vercel-turso.md).

## Next implementation steps

1. Replace placeholder AI/STT services with production integrations.
2. Add Google OAuth and billing entitlements.
3. Expand tests, observability, and CI/CD.
