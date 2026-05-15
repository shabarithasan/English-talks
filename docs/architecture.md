# Architecture Overview

## Product shape

This repository is structured as a monorepo so the public marketing experience, authenticated learner app, and `English Talks` API can evolve together while still being separable for independent deployment later.

- `apps/web`: Next.js app-router frontend
- `apps/api`: Express + TypeScript API starter
- `packages/shared`: shared route metadata, types, and starter content models

## Frontend

- Next.js handles SEO-friendly public routes and the learner dashboard shell.
- Marketing pages are route-preserving and map to the product areas described in the source brief.
- The current shell includes routes for `home`, `about`, `business`, `schools`, `programs`, `ielts`, `ielts-writing`, `jobinterview`, `leveltest`, `vocabulary-booster`, `dashboard`, `practice`, and `results`.
- Styling uses a small custom design system with warm neutrals, teal accents, and expressive typography rather than default SaaS styling.

## Backend

- Express is used for the backend, and Prisma provides persistent storage through SQLite in the current local setup.
- Current route groups:
  - `/health`
  - `/api/v1/auth`
  - `/api/v1/user`
  - `/api/v1/catalog`
  - `/api/v1/practice`
  - `/api/v1/webhooks`
- Auth is JWT-based with secure-cookie support and persistent Prisma-backed users.
- Audio transcription and AI assessment are placeholder services now so frontend and API contracts can stabilize before third-party integration work begins.

## Data model

The Prisma schema in [schema.prisma](/C:/Users/shaba/OneDrive/Documents/English%20speech%20pratices%20app/apps/api/prisma/schema.prisma) includes:

- `User`, `Organization`, `Subscription`
- `Session`, `Transcript`, `TranscriptSegment`, `Assessment`
- `Course`, `Lesson`, `Progress`
- `Certificate`

This matches the implementation plan’s need to track learner identity, org membership, assessments, transcripts, lessons, progress, and certification.

## Recommended next steps

1. Add production-grade migrations and move from local SQLite to managed PostgreSQL when needed.
2. Add OpenAI/STT provider adapters behind explicit interfaces.
3. Introduce websocket streaming for live transcript updates.
4. Add Stripe checkout, subscription state sync, and entitlement middleware.
