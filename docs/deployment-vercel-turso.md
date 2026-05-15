# Vercel + Turso Deployment

This repository is set up to deploy as two Vercel projects from the same monorepo:

1. `apps/web` for the Next.js frontend
2. `apps/api` for the Express API

This follows Vercel's monorepo guidance, where each deployable app is imported with its own Root Directory.

## Project 1: Frontend

Create a Vercel project with:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`

Frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-api-project.vercel.app
NEXT_PUBLIC_MARKETING_SITE_URL=https://your-frontend-project.vercel.app
NEXT_PUBLIC_APP_URL=https://your-frontend-project.vercel.app/dashboard
```

## Project 2: API

Create a second Vercel project with:

- Root Directory: `apps/api`
- Framework Preset: `Other`

The API is Vercel-ready through:

- [src/server.ts](/C:/Users/shaba/OneDrive/Documents/English speech pratices app/apps/api/src/server.ts)
- [vercel.json](/C:/Users/shaba/OneDrive/Documents/English speech pratices app/apps/api/vercel.json)

API environment variables:

```env
API_PORT=4000
CLIENT_URL=https://your-frontend-project.vercel.app
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_URL=file:./english-talks.db
TURSO_DATABASE_URL=libsql://your-db-name-your-user.turso.io
TURSO_AUTH_TOKEN=your_turso_token
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Turso setup

In Turso:

1. Create your database.
2. Copy the `libsql://...` connection URL.
3. Create a database auth token.
4. Add both values to the API project's environment variables in Vercel.

## Important deployment note

The running API will automatically use Turso when `TURSO_DATABASE_URL` is present. If it is absent, the app falls back to local SQLite.

## After the first API deploy

Seed your production or staging data from a machine that has the same environment variables:

```bash
npm install
npm run db:generate --workspace @english-talks/api
npm run db:seed --workspace @english-talks/api
```

## Recommended domain flow

- Frontend: `english-talks.vercel.app` or your custom domain
- API: `english-talks-api.vercel.app`

Then point the frontend's `NEXT_PUBLIC_API_URL` to the API domain.

## Notes

- The Express API is deployed as a single Vercel Function.
- Shared packages work because this repo uses npm workspaces.
- If Vercel blocks files outside the Root Directory during import, enable the setting to include source files outside the Root Directory for the API project because it depends on the shared workspace package.
