# Developer Handoff Checklist

## Environment

- Install Node.js 24+ and npm 11+.
- Create `apps/web/.env.local` and `apps/api/.env` from the root `.env.example`.
- The repo currently runs with a local SQLite database via Prisma.
- Provision Stripe test credentials and AI/STT sandbox keys for the next integration stage.

## Repo startup

```bash
npm install
npm run dev
```

## Frontend

- Marketing routes are ready for content expansion.
- Learner routes are UI shells only and need real auth/data wiring.
- Replace placeholder metrics and transcript cards with API-driven state.

## Backend

- Auth and profile storage are Prisma-backed and persisted locally.
- Practice and scoring endpoints persist sessions, transcripts, and assessments, but still return placeholder AI output for rapid UI integration.
- Stripe webhook verification still needs production signature validation.

## Database

- Use the Prisma schema as the initial relational contract.
- Add migrations before the first shared dev environment rollout.
- Seed courses, lessons, and rubric configurations for frontend integration.

## Release readiness

- Add linting, unit tests, and end-to-end flows.
- Add error tracking and health-based alerting.
- Add deployment manifests and CI gates for build and typecheck.
