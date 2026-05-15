# Turso Setup

`English Talks` can now run against Turso while keeping the same Prisma SQLite schema.

## What is already done

- Prisma runtime supports Turso through `@prisma/adapter-libsql`
- Local SQLite fallback still works
- Seed script supports either local SQLite or Turso depending on environment variables

## What you need to provide

From your Turso account:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## How to get them

Based on Prisma's official Turso guide:

1. Create a Turso database.
2. Retrieve the database URL.
3. Create a database auth token.
4. Paste both values into [apps/api/.env](</C:/Users/shaba/OneDrive/Documents/English speech pratices app/apps/api/.env>).

Expected values:

```env
TURSO_DATABASE_URL=libsql://your-db-name-your-user.turso.io
TURSO_AUTH_TOKEN=your_turso_token
```

## Important note

Prisma's Turso support uses the SQLite provider with a libSQL adapter at runtime. Local development and remote Turso runtime can share the same Prisma data model, but remote schema-change workflows are not the same as local SQLite migrations.

## After adding credentials

Run:

```bash
npm install
npm run db:generate --workspace @english-talks/api
npm run db:seed --workspace @english-talks/api
npm run dev
```

## Current storage behavior

- If `TURSO_DATABASE_URL` is empty, data is stored in the local SQLite file.
- If `TURSO_DATABASE_URL` is set, the running API stores app data in Turso.
