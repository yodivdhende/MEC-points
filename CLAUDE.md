# CLAUDE.md

Guidance for Claude Code when working in this repository.

> **Keep this file up to date.** Whenever the scope of the project changes (features added, removed, or reworked), update this file so it accurately reflects the current goals of the app.

## Project Overview

MEC-Points is a webapp for tracking and displaying **house points** at a magical school. There are 5 houses (see shield assets in `src/lib/assets/`: Alcertis, Ibidens, Lutridus, Paventia, Luvium), each with a running point total that can go up or down. Points are bounded between **-99 (min)** and **999 (max)**.

## Tech Stack

- **SvelteKit** (Svelte 5, TypeScript) — app framework
- **Drizzle ORM** + **Postgres** — data layer (`src/lib/server/db/`)
- Plain CSS (no Tailwind/CSS framework) — theme tokens in `src/lib/styles/theme.css`
- **layerchart** — charting library used on `/statistics` (see `src/routes/statistics/CLAUDE.md`); its lower-level components don't require Tailwind, only `layerchart/core.css`
- **pnpm** — package manager
- Schema changes go through Drizzle migrations (`pnpm db:generate` then `pnpm db:push` locally), not manual/hand-edited SQL. `pnpm db:studio` opens a DB browser for inspecting/adjusting data.
- **Deployment (Railway):** the generated SQL migrations in `drizzle/` are applied to the production database automatically via `pnpm db:migrate` (`src/lib/server/db/migrate.ts`, using `drizzle-orm`'s migrator), configured as the Railway service's Pre-Deploy Command — it runs before each new deploy starts serving traffic. Seeding the 5 houses (`pnpm db:seed`) is still a manual, one-time step on a fresh database.

## Core Features

1. **House overview screen** — _(implemented)_ a display-only screen showing all 5 houses side by side, each with its shield/crest and current point total (range -99 to 999, always rendered as 3 characters). Meant to be shown publicly (e.g. on a screen in a common area), and stays live via Server-Sent Events so it never needs a manual refresh. See `src/routes/houses/CLAUDE.md` for the SSE implementation. The same screen also rotates through recent point-transaction messages (see feature 6).

2. **Professor point submission** — _(implemented)_ each professor has their own page to submit a point change (positive or negative) to a searched-for student or a whole house, with an optional message. This is how house totals get updated. Every change is recorded in `point_transactions` (house, professor, optional student, optional message, delta, timestamp) alongside a denormalized running total on `houses.points`, which is what makes the statistics screen below feasible without re-summing history on every read. See `src/routes/professors/CLAUDE.md` for implementation details.

3. **Statistics screen** — _(partially implemented)_ `/statistics` shows a line graph of each house's point total over the last 4 days (one line per house, built with [layerchart](https://next.layerchart.com)), reconstructed from `point_transactions`. See `src/routes/statistics/CLAUDE.md` for implementation details. Not yet built: a period selector, and "which professor has awarded the most points overall" (the `point_transactions` table already stores everything that needs, too — see the `professorId IS NOT NULL` note below).

4. **Yearly score reset** — _(implemented)_ a button on `/professors` (behind a confirmation modal, since this is destructive and irreversible) zeroes every house's point total in one go. See `src/routes/professors/CLAUDE.md` for implementation details.

5. **Student roster** — _(implemented)_ a form on `/professors` for adding and removing students, each assigned to one of the 5 houses. A professor's point submission can optionally target a specific student (see feature 2), which is recorded via `point_transactions.studentId`. See `src/routes/professors/CLAUDE.md` for implementation details.

6. **Recent messages feed** — _(implemented)_ the house overview screen (`src/routes/+page.svelte`) also displays a rotating banner cycling through `point_transactions` from the past 2 hours that carry a professor's message (whole-house-reset rows and messageless submissions are excluded), oldest first, one message every 20 seconds, updating live via the same SSE channel as the house point totals. Fetching and pushing this feed is owned by `src/lib/server/message-feed.ts`. See `src/routes/houses/CLAUDE.md` for the SSE payload details.

## Data model

- `professors` — `id` (UUID), `name`, `active`.
- `students` — `id` (UUID), `name`, `houseId` (required FK to `houses`). Now referenced by `point_transactions.studentId` (nullable FK, `ON DELETE no action`) once a professor has awarded that student points — removing a student who already has transaction history will fail at the DB level; `src/lib/server/db/students.ts`'s hard delete is only safe for students with no recorded transactions.
- `houses` — `id` (UUID), `name`, `slug` (stable key used to seed the 5 fixed houses and to look up their crest asset via `src/lib/assets/crests.ts`), `points` (cached running total, clamped to -99..999).
- `point_transactions` — `id` (UUID), `houseId`, `professorId`, `studentId`, `message`, `delta`, `createdAt`. One row per submitted point change; `houses.points` is kept in sync with it inside a DB transaction (`applyPointDelta` in `src/lib/server/db/houses.ts`). `professorId` is nullable: the yearly reset (`resetAllHousePoints`) isn't tied to one professor, so its rows are recorded with `professorId = null`. Any future "points awarded per professor" query must filter `WHERE professor_id IS NOT NULL` to exclude these. `studentId` is nullable — set when a professor targets a specific student rather than a whole house — and `message` is an optional free-text note a professor can attach to a submission; both back the main page's recent-messages feed (feature 6 above, `src/lib/server/message-feed.ts`).
- The 5 houses are seeded via `pnpm db:seed` (`src/lib/server/db/seed.ts`), which is idempotent (`onConflictDoNothing` on `slug`) and must be run manually after `pnpm db:push` on a fresh database — nothing seeds them automatically.
- Point clamping logic (`MIN_POINTS`/`MAX_POINTS`/`clampPoints`) lives in `src/lib/util/points.ts`, shared by both client (optimistic UI) and server (authoritative validation). `src/lib/util/` is for simple, dependency-light exported helpers in general (see its own CLAUDE.md).

## Notes for Future Changes

- This document describes the intended scope, not necessarily what's fully implemented yet — update it as features are built out or the scope evolves.
- Any change to the database schema should be made via Drizzle migrations, keeping migration history intact for both local dev and deployment.
