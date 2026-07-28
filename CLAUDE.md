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

1. **House overview screen** — a display-only screen showing all 5 houses, each with its shield/crest and current point total (range -99 to 999). Meant to be shown publicly (e.g. on a screen in a common area).

2. **Professor point submission** — each professor has their own page to submit point changes (positive or negative) to a house. This is how house totals get updated.

3. **Statistics screen** — shows historical trends: which house has earned or lost the most points over a given period, and which professor has awarded the most points overall.

4. **Yearly score reset** — professors can clear/reset all house point totals (e.g. at the end of a school year). Because this is destructive and irreversible, it must be gated behind a clear confirmation warning before it executes.

## Notes for Future Changes

- This document describes the intended scope, not necessarily what's fully implemented yet — update it as features are built out or the scope evolves.
- Any change to the database schema should be made via Drizzle migrations, keeping migration history intact for both local dev and deployment.
