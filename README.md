# MEC-Points

A webapp for tracking and displaying **house points** at a magical school. Five houses (Alcertis, Ibidens, Lutridus, Paventia, Luvium) each have a running point total, shown live on a public overview screen and updated by professors from their own submission page.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, TypeScript)
- [Drizzle ORM](https://orm.drizzle.team/) + Postgres for the data layer
- [pnpm](https://pnpm.io/) as the package manager

See [`CLAUDE.md`](./CLAUDE.md) for a full overview of the project's features and data model.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.6+ (the `db:migrate`/`db:seed` scripts use `--experimental-strip-types`)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/) (for Postgres, or for the fully dockerized flow below)

## Local development

There are two ways to run the app locally.

### Option A: Fully dockerized (simplest)

```sh
docker compose up
```

This builds the app container, starts Postgres, applies database migrations, seeds the 5 houses, and starts the dev server at [http://localhost:5173](http://localhost:5173) — all automatically. Seeding is idempotent, so it's safe to leave in the startup command: it only inserts the houses the first time and no-ops on every `docker compose up` after that.

### Option B: App on the host, Postgres in Docker

Useful if you want faster local iteration outside of Docker.

```sh
# 1. start just the database
docker compose up db

# 2. copy the env file (DATABASE_URL points at the dockerized db)
cp .env.example .env

# 3. install dependencies
pnpm install

# 4. sync the schema to your local database
pnpm db:push

# 5. seed the 5 houses (one-time, safe to re-run)
pnpm db:seed

# 6. start the dev server
pnpm dev
# or: pnpm dev -- --open
```

## Useful scripts

| Script             | Purpose                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `pnpm dev`         | Start the dev server                                                  |
| `pnpm build`       | Build a production version of the app                                 |
| `pnpm preview`     | Preview the production build                                          |
| `pnpm check`       | Type-check the project                                                |
| `pnpm lint`        | Check formatting and lint                                             |
| `pnpm format`      | Auto-format the project                                               |
| `pnpm db:push`     | Push the current Drizzle schema straight to the database (local dev)  |
| `pnpm db:generate` | Generate a SQL migration from schema changes (`drizzle/`)             |
| `pnpm db:migrate`  | Apply generated migrations (used in Docker and in production deploys) |
| `pnpm db:seed`     | Seed the 5 fixed houses (idempotent)                                  |
| `pnpm db:studio`   | Open Drizzle Studio to browse/edit the database                       |

Schema changes should go through `pnpm db:generate` + `pnpm db:push`/`pnpm db:migrate` rather than hand-edited SQL, to keep migration history intact — see `CLAUDE.md` for details.

## Building for production

```sh
pnpm build
```

You can preview the production build with `pnpm preview`. On Railway, migrations (`pnpm db:migrate`) run automatically as a pre-deploy step before each new deploy starts serving traffic — see `CLAUDE.md` for deployment details.
