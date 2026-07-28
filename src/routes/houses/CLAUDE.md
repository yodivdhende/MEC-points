# src/routes/houses

Guidance for Claude Code when working in this directory.

Covers the live-update channel backing the house overview screen (`src/routes/+page.svelte`).

## `/houses/events` — Server-Sent Events endpoint

`+server.ts` exposes a `GET` handler that returns a `text/event-stream` response. Each connected client stays subscribed to `onHouseUpdate` (`src/lib/server/house-events.ts`) for the lifetime of the request; `applyPointDelta` (`src/lib/server/db/houses.ts`) calls `publishHouseUpdate` after every write, so any future writer of house points (e.g. the not-yet-built yearly reset) gets live updates for free as long as it also goes through `applyPointDelta`.

- Message payload: `data: {"id": string, "slug": string, "points": number}\n\n` — one event per house update.
- A `: ping\n\n` comment is sent every ~25s as a heartbeat so idle connections aren't dropped by intermediate proxies.
- The client (`src/routes/+page.svelte`) uses the browser's native `EventSource`, which reconnects automatically on drop — no custom retry logic needed.

## Notes

- `publishHouseUpdate`/`onHouseUpdate` are an in-process, in-memory pub/sub (a module-level `Set` of listeners) — this only works because the app runs as a single `adapter-node` server instance. If this ever becomes a multi-instance deployment, updates from one instance won't reach clients connected to another; would need a shared broker (e.g. Postgres `LISTEN`/`NOTIFY`) at that point.
