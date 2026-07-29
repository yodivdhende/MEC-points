# src/routes/houses

Guidance for Claude Code when working in this directory.

Covers the live-update channel backing the house overview screen (`src/routes/+page.svelte`), which carries both house point updates and the recent-messages feed.

## `/houses/events` — Server-Sent Events endpoint

`+server.ts` exposes a `GET` handler that returns a `text/event-stream` response, multiplexing two event kinds over one stream (a single `EventSource` on the client, discriminated by a `type` field):

- **House update** — `data: {"type":"house","id":string,"slug":string,"points":number}\n\n`. The client stays subscribed to `onHouseUpdate` (`src/lib/server/house-events.ts`) for the lifetime of the request; `applyPointDelta` (`src/lib/server/db/houses.ts`) calls `publishHouseUpdate` after every write, so any writer of house points (including the yearly reset) gets live updates for free as long as it goes through `applyPointDelta`.
- **Message event** — `data: {"type":"message","id":string,"houseSlug":string,"houseName":string,"professorName":string|null,"studentName":string|null,"delta":number,"message":string,"createdAt":string}\n\n`. Sourced from `onMessage` (`src/lib/server/message-feed.ts`), a separate pub/sub from the house-update one. `applyPointDelta` calls `notifyNewTransaction` after every write, which only publishes when a non-empty `message` was recorded — so messageless submissions and the yearly reset (which always passes `message: null`) never emit a message event, with no special-casing needed at either call site. `id` is the transaction id (used by the client for dedup), `professorName`/`studentName` are `null` to signal "no professor" (shouldn't occur in practice, since reset rows have no message) / "whole house" respectively.

A `: ping\n\n` comment is sent every ~25s as a heartbeat so idle connections aren't dropped by intermediate proxies. The client (`src/routes/+page.svelte`) uses the browser's native `EventSource`, which reconnects automatically on drop — no custom retry logic needed. On the client, house events patch the local house list in place; message events are appended to a `$state` array (deduped by `id`, re-sorted by `createdAt`) that a `setInterval` rotates through one at a time (20s each) and prunes down to the past 2 hours, rendered via `src/lib/components/RecentMessageBanner.svelte`.

## Notes

- `house-events.ts` (`publishHouseUpdate`/`onHouseUpdate`) and `message-feed.ts` (`publishMessage`/`onMessage`, plus the DB read `getRecentMessages`) are each an in-process, in-memory pub/sub (a module-level `Set` of listeners) — this only works because the app runs as a single `adapter-node` server instance. If this ever becomes a multi-instance deployment, updates from one instance won't reach clients connected to another; would need a shared broker (e.g. Postgres `LISTEN`/`NOTIFY`) at that point.
