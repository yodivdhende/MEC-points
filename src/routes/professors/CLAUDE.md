# src/routes/professors

Guidance for Claude Code when working in this directory.

Covers professor management (`/professors`) and each professor's point submission page (`/professors/[id]`).

## Professor management — `/professors`

Lists active/inactive professors with `add`/`deactivate`/`reactivate` form actions (`+page.server.ts`). Professors are only ever deactivated, never deleted, so `point_transactions` history stays attributable.

## Point submission — `/professors/[id]`

Lists the 5 houses with add/subtract buttons; taps update the display instantly and are batched into a single request per house after 5 seconds of inactivity.

- `+page.server.ts` — `load` fetches the professor and all houses; `actions.adjust` validates and applies a delta via `applyPointDelta` (`src/lib/server/db/houses.ts`), returning the authoritative clamped total.
- `+page.svelte` — instantiates one `HousePoints` (`src/lib/state/house-points.svelte.ts`) per house, which owns the optimistic display, the debounce/batch timer, the `?/adjust` fetch + reconciliation, and a `sendBeacon` flush on `beforeunload`/`pagehide` so pending taps aren't lost when navigating away.
- `HouseCard` (`src/lib/components/HouseCard.svelte`) is the presentational component — crest, name, status label, +/- buttons — driven entirely by props from the `HousePoints` instances.

## Notes

- There is currently no authentication — a professor's page is reachable by anyone who knows/guesses `/professors/[id]`. This is a known gap, not an oversight; revisit if/when auth is added to scope.
