# src/routes/professors

Guidance for Claude Code when working in this directory.

Covers professor management (`/professors`) and each professor's point submission page (`/professors/[id]`).

## `/professors` — component structure

`+page.svelte` is just composition + grid layout; the three sections are their own components colocated in this route folder, each built from generic primitives in `src/lib/components/`:

- `ProfessorRoster.svelte` — professor list (active/inactive) + add form.
- `StudentRoster.svelte` — student list + add form.
- `ResetHousePoints.svelte` — the yearly reset button.

Shared primitives these are built from:

- `RosterRow.svelte` — one list row (label, optional link/tag/muted state, trailing action snippet). Used for professor rows (active/inactive) and student rows.
- `AddCard.svelte` — card chrome (title + form via `children` snippet + optional error) for the two "add X" forms.
- `ConfirmSubmitForm.svelte` — packages the hidden-form + `use:enhance` + `ConfirmDialog` (`src/lib/components/ConfirmDialog.svelte`, a plain `<dialog>`-based confirmation modal) wiring for any confirm-gated destructive submit. Reach for this (not raw `ConfirmDialog`) whenever a new destructive action needs a confirm step tied to a form action.

## Professor management

`ProfessorRoster.svelte` renders active/inactive professors with `add`/`deactivate`/`reactivate` form actions (`+page.server.ts`). Professors are only ever deactivated, never deleted, so `point_transactions` history stays attributable.

`ResetHousePoints.svelte` — the yearly score reset. It isn't tied to a specific professor, so it's gated behind `ConfirmSubmitForm`/`ConfirmDialog` rather than executing immediately like `deactivate`/`reactivate`. Confirming submits the `resetAll` action, which calls `resetAllHousePoints` (`src/lib/server/db/houses.ts`) — this zeroes every house via `applyPointDelta` per house (delta = negative of its current total), so it logs a `point_transactions` row per house and propagates live to the `/` overview screen exactly like a normal point submission. Since the reset isn't attributed to one professor, those rows have `professorId = null` (see root `CLAUDE.md` data model note).

## Student management

`StudentRoster.svelte` lists all students with `addStudent`/`removeStudent` form actions, backed by `src/lib/server/db/students.ts`. Unlike professors, students aren't referenced by any other table (no attribution to preserve), so removal is a hard `DELETE` rather than a soft-deactivate — gated behind `ConfirmSubmitForm`, since it's irreversible. Every student belongs to exactly one house (`houseId`, required); the add form has a house `<select>` (populated from `listHouses()`, also loaded on this page) and `listStudents()` joins in the house row so it can be shown per student.

## Point submission — `/professors/[id]`

A single-target form: the professor searches for a student or a whole house, sets a point delta, optionally adds a message, then submits explicitly. Each submission is one `?/adjust` request (no more per-house tap batching).

- `+page.server.ts` — `load` fetches the professor, all houses, and all students (`listStudents`, joined with house for display). `actions.adjust` reads `houseId`, optional `studentId`, `delta`, and optional `message` from the form, validates them, and applies the change via `applyPointDelta` (`src/lib/server/db/houses.ts`), returning the authoritative clamped total.
- `+page.svelte` — holds the selected `Target` (house or student), the pending `delta` (adjusted via +/- buttons), and the `message` textarea. On successful submit it resets the form and shows a brief "Saved: ..." confirmation; `target`/`delta`/`message` are cleared so the professor can immediately submit for the next student.
- `TargetPicker` (`src/lib/components/TargetPicker.svelte`) is a searchable combobox listing every house ("X (whole house)") and every student, filtered by substring match on typed text. Selecting a student resolves its `houseId` for the submission. Student option labels are tinted by house via `src/lib/assets/house-colors.ts`. The `Target` type is exported from the sibling `target-picker.ts` (not the `.svelte` file) — importing types from `<script module>` in a `.svelte` file tripped up `svelte-check`'s control-flow narrowing for `Target | null` locals elsewhere, so the type lives in a plain `.ts` file instead.
- A submission optionally names a specific student and/or carries a free-text `message` (capped at 280 chars server-side), both stored on the `point_transactions` row (see root `CLAUDE.md` data model note) for the not-yet-built main-page display of recent point changes.

## Notes

- There is currently no authentication — a professor's page is reachable by anyone who knows/guesses `/professors/[id]`. This is a known gap, not an oversight; revisit if/when auth is added to scope.
