# CLAUDE.md

Guidance for Claude Code when working in this repository.

> **Keep this file up to date.** Whenever the scope of the project changes (features added, removed, or reworked), update this file so it accurately reflects the current goals of the app.

## Project Overview

MEC-Points is a webapp for tracking and displaying **house points** at a magical school. There are 5 houses (see shield assets in `src/lib/assets/`: Alcertis, Ibidens, Lutridus, Paventia, Luvium), each with a running point total that can go up or down. Points are bounded between **-99 (min)** and **999 (max)**.

## Tech Stack

- **SvelteKit** (Svelte 5, TypeScript) — app framework
- **Drizzle ORM** + **Postgres** — data layer (`src/lib/server/db/`)
- **pnpm** — package manager
- Schema changes go through Drizzle migrations (`pnpm db:generate` then `pnpm db:push`), not manual/hand-edited SQL. `pnpm db:studio` opens a DB browser for inspecting/adjusting data.

## Core Features

1. **House overview screen** — *(implemented)* a display-only screen showing all 5 houses side by side, each with its shield/crest and current point total (range -99 to 999, always rendered as 3 characters). Meant to be shown publicly (e.g. on a screen in a common area), and stays live via Server-Sent Events so it never needs a manual refresh. See `src/routes/houses/CLAUDE.md` for the SSE implementation.

2. **Professor point submission** — *(implemented)* each professor has their own page to submit point changes (positive or negative) to a house. This is how house totals get updated. Every change is recorded in `point_transactions` (house, professor, delta, timestamp) alongside a denormalized running total on `houses.points`, which is what makes the statistics screen below feasible without re-summing history on every read. See `src/routes/professors/CLAUDE.md` for implementation details.

3. **Statistics screen** — shows historical trends: which house has earned or lost the most points over a given period, and which professor has awarded the most points overall. Not yet built, but the `point_transactions` table already stores everything this needs.

4. **Yearly score reset** — professors can clear/reset all house point totals (e.g. at the end of a school year). Because this is destructive and irreversible, it must be gated behind a clear confirmation warning before it executes.

## Data model

- `professors` — `id` (UUID), `name`, `active`.
- `houses` — `id` (UUID), `name`, `slug` (stable key used to seed the 5 fixed houses and to look up their crest asset via `src/lib/assets/crests.ts`), `points` (cached running total, clamped to -99..999).
- `point_transactions` — `id` (UUID), `houseId`, `professorId`, `delta`, `createdAt`. One row per submitted point change; `houses.points` is kept in sync with it inside a DB transaction (`applyPointDelta` in `src/lib/server/db/houses.ts`).
- The 5 houses are seeded via `pnpm db:seed` (`src/lib/server/db/seed.ts`), which is idempotent (`onConflictDoNothing` on `slug`) and must be run manually after `pnpm db:push` on a fresh database — nothing seeds them automatically.
- Point clamping logic (`MIN_POINTS`/`MAX_POINTS`/`clampPoints`) lives in `src/lib/util/points.ts`, shared by both client (optimistic UI) and server (authoritative validation). `src/lib/util/` is for simple, dependency-light exported helpers in general (see its own CLAUDE.md).

## Notes for Future Changes

- This document describes the intended scope, not necessarily what's fully implemented yet — update it as features are built out or the scope evolves.
- Any change to the database schema should be made via Drizzle migrations, keeping migration history intact for both local dev and deployment.
