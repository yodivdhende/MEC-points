# src/routes/professors

Guidance for Claude Code when working in this directory.

Covers professor management (`/professors`) and each professor's point submission page (`/professors/[id]`).

## Professor management — `/professors`

Lists active/inactive professors with `add`/`deactivate`/`reactivate` form actions (`+page.server.ts`). Professors are only ever deactivated, never deleted, so `point_transactions` history stays attributable.

This page also has a "Reset all house points" button, for the yearly score reset. It isn't tied to a specific professor, so it's gated behind `ConfirmDialog` (`src/lib/components/ConfirmDialog.svelte`, a plain `<dialog>`-based confirmation modal — the general-purpose one to reach for if another destructive action needs confirmation later) rather than executing immediately like `deactivate`/`reactivate`. Confirming submits the `resetAll` action, which calls `resetAllHousePoints` (`src/lib/server/db/houses.ts`) — this zeroes every house via `applyPointDelta` per house (delta = negative of its current total), so it logs a `point_transactions` row per house and propagates live to the `/` overview screen exactly like a normal point submission. Since the reset isn't attributed to one professor, those rows have `professorId = null` (see root `CLAUDE.md` data model note).

## Point submission — `/professors/[id]`

Lists the 5 houses with add/subtract buttons; taps update the display instantly and are batched into a single request per house after 5 seconds of inactivity.

- `+page.server.ts` — `load` fetches the professor and all houses; `actions.adjust` validates and applies a delta via `applyPointDelta` (`src/lib/server/db/houses.ts`), returning the authoritative clamped total.
- `+page.svelte` — instantiates one `HousePoints` (`src/lib/state/house-points.svelte.ts`) per house, which owns the optimistic display, the debounce/batch timer, the `?/adjust` fetch + reconciliation, and a `sendBeacon` flush on `beforeunload`/`pagehide` so pending taps aren't lost when navigating away.
- `HouseCard` (`src/lib/components/HouseCard.svelte`) is the presentational component — crest, name, status label, +/- buttons — driven entirely by props from the `HousePoints` instances.

## Notes

- There is currently no authentication — a professor's page is reachable by anyone who knows/guesses `/professors/[id]`. This is a known gap, not an oversight; revisit if/when auth is added to scope.
