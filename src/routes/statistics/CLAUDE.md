# src/routes/statistics

Guidance for Claude Code when working in this directory.

Covers `/statistics`: a display-only line graph of each house's point total over the last 4 days, and a bar graph of each active professor's point activity over that same window — both built with [layerchart](https://next.layerchart.com).

## Data

`src/lib/server/db/statistics.ts` (`getHousePointsHistory(since)`) reconstructs each house's point total over `[since, now]` from `point_transactions`: it fetches transactions with `createdAt >= since`, sums their deltas, and derives a **baseline** — `clampPoints(house.points - deltaSum)` — which is what the house's total was right at `since`. It then replays the in-window transactions forward from that baseline with the same `clampPoints` helper `applyPointDelta` uses (`src/lib/util/points.ts`). The returned series always starts at `since` and ends at "now", so every house's line spans the full window even with no recent activity.

**Known limitation:** the baseline is derived by subtracting deltas from the current total rather than replaying full history from zero, so it can drift slightly from the true historical value only if clamping (hitting -99/999) happened _inside_ the window. Acceptable at this app's scale; a full-history replay would be the fix if it ever matters.

`+page.server.ts` calls this with a fixed `since = now - 4 days` (`WINDOW_DAYS` constant) — there is no period selector UI, by design. Timestamps are serialized to ISO strings for the client. Each point also carries `delta`, `professorName`, `studentName`, and `message` (joined from `professors`/`students`, mirroring the join pattern in `src/lib/server/message-feed.ts`) — populated for real transactions, `null` for the synthetic baseline/"now" points, and used by the chart's hover tooltip.

`getProfessorPointActivity(since)` (same file) answers "how many points has each professor given out or taken away in the window" — one row per **active** professor (`listActiveProfessors()` drives membership, so a professor with zero activity in the window still appears with `gifted: 0, subtracted: 0`), with a SQL-side `GROUP BY professor_id` summing positive deltas into `gifted` and negative deltas into `subtracted` separately. `isNotNull(pointTransactions.professorId)` excludes yearly-reset rows (`professorId = null`, see root `CLAUDE.md`). This is scoped to the same 4-day window as the house chart, not all-time — "which professor has awarded the most points overall" (root CLAUDE.md's original framing) would need a separate all-time query if that's ever wanted.

## Chart — why primitives, not Tailwind

LayerChart's higher-level components style themselves via their own `lc-*` CSS classes (defined in scoped `<style>` blocks using CSS custom properties like `--color-surface-content`, with `currentColor`/`light-dark()` fallbacks) — **not** raw Tailwind utility classes at runtime. `@layerstack/tailwind` is only needed by consumers who want to theme those custom properties through a Tailwind config; it's not required to use the library. Since `--color-surface-content` falls back to `currentColor`, and the app's global `color: var(--color-ink)` on `body` (`src/lib/styles/theme.css`) already cascades down, axis/tick text picks up the theme's ink color for free with zero extra config.

Given that, `HousePointsChart.svelte` uses layerchart's `LineChart` convenience component directly (not hand-assembled `Chart`/`Svg`/`Axis`/`Spline` primitives) rather than avoiding it — it's the more idiomatic use of the library and doesn't require Tailwind either way:

- `series` is one entry per house — `{ key: slug, label: name, color: houseColors[slug], data, value }` — each with its own `data` array (each point stamped with `houseSlug`/`houseName` too, see tooltip note below) sourced from `getHousePointsHistory`. `color` comes from `src/lib/assets/house-colors.ts`, the same palette used to tint student names in `TargetPicker`.
- `x` is a shared accessor (`d.timestamp`) with `xScale={scaleTime()}` (from `d3-scale`); `yDomain`'s bounds both track the current totals — `highestCurrentPoints` is the highest *current* total across houses (last point in each series, floored at 0) and `lowestCurrentPoints` is the lowest (capped at 0, falling back to `MIN_POINTS` if a series is empty) — rather than the fixed `MIN_POINTS`..`MAX_POINTS` (-99..999) range, so the chart zooms to the actual data instead of squashing it into a sliver of the full axis.
- `layerchart/core.css` is imported once (in `HousePointsChart.svelte`) — it only declares the CSS `@layer` cascade order LayerChart's component styles rely on; framework presets (Tailwind, shadcn, skeleton) do this automatically, non-Tailwind consumers import it manually.
- The legend is hand-built (not LayerChart's `Legend`) so it can pair each house's color swatch with its crest (`src/lib/assets/crests.ts`), matching the visual language of `HouseOverviewCard` on the main screen.

## Hover tooltip

`tooltipContext={{ mode: 'quadtree' }}` switches LineChart's default multi-series-at-one-x tooltip into single-point mode, so hovering finds the _nearest individual data point_ (one specific house, one specific moment) rather than every house's value at a shared x position — appropriate here since the extra fields below only make sense per-transaction, not aggregated across houses.

A custom `tooltip` snippet (passed to `LineChart`, overriding its `DefaultTooltip`) is built from LayerChart's own `Tooltip.Root`/`Header`/`List`/`Item` primitives (`import { Tooltip } from 'layerchart'`) and shows: house name + color swatch (header), the point's timestamp, its running total, and — only when present — the transaction's `delta` (`+N`/`-N` via `formatSignedDelta`, `src/lib/util/points.ts`), `professorName`, `studentName`, and `message`. The synthetic baseline/"now" points (and any real transaction missing a field) simply omit those rows.

**Why each point carries `houseSlug`/`houseName` directly** (rather than looking up the hovered series via LayerChart's `context.tooltip.series`/`seriesKey`): the `data` passed to `LineChart` here is our own flat array (`chartSeries.flatMap(s => s.data)`), not LayerChart's internally-derived series data — so the `quadtree` tooltip mode's hit-tested point doesn't come back with LayerChart's own `seriesKey` annotation attached. Stamping the house directly onto each point sidesteps that entirely and is simpler than reconstructing series lookup.

## Professor activity bar graph

`ProfessorPointsChart.svelte` renders `getProfessorPointActivity`'s rows as a **horizontal, diverging grouped bar chart** via layerchart's `BarChart` (`orientation="horizontal"`, `seriesLayout="group"`): each professor is a row (`y`), gifted points extend right of the zero baseline and subtracted points extend left, so a professor's full activity is visible even when it nets close to zero. Horizontal (not vertical) was chosen so professor names render in full rather than crowding/rotating x-axis labels.

- **Colors**: gifted uses the app's `--color-rust` accent (`#7f3d1d`). Subtracted needed a second, clearly distinct hue for a diverging pair — the app's existing `--color-teal` (`#2b5672`) fails a chroma-floor check (reads as too gray next to rust: OKLCH C 0.067 vs a 0.10 floor). `#0d6690` was chosen instead and validated to pass every check (lightness band, chroma floor, CVD ΔE 16.9, normal-vision ΔE 20.6, contrast) paired with rust. Both are local consts in the component rather than new `theme.css`/`house-colors.ts`-style tokens, since they're specific to this one chart.
- **Data shape — per-series `data`, not a shared `value` accessor**: each series (`gifted`/`subtracted`) gets its own mapped `data` array (mirroring `HousePointsChart`'s per-house series), with a shared `amount` field read via the chart's top-level `x` accessor. This is a deliberate workaround: layerchart's grouped horizontal-bar layout derives each series' sub-band row position from `series.key`, but if `series.value` is _also_ set (the more obvious approach for "one row, two fields"), it uses that function reference for the lookup instead and every bar's position resolves to `NaN`. Splitting into per-series `data` (both derived from the same `activity` prop, same row order) sidesteps the bug.
- **Tooltip**: a custom snippet (same `Tooltip.Root/Header/List/Item` primitives as `HousePointsChart`) rather than layerchart's default band-mode tooltip — the default resolves each series' displayed value through the same `series.value` mechanism above, which breaks for the same reason once series don't share one `value` accessor. The custom snippet instead looks up the hovered bar's `professorId` in a `Map` built from the original `activity` prop and shows that professor's `gifted`, `subtracted`, and net total directly.
- **Left padding**: layerchart's default chart padding reserves only 20px for axis labels — fine for short tick text, but professor names get clipped against the card edge (worst on narrow viewports) since the library doesn't measure label width. `chartPadding` computes a `left` value from the longest professor name instead, keeping the other sides at layerchart's own axis defaults (`top: 4, right: 4, bottom: 20`).
- Bars still show for every active professor even with no activity in the window (zero-width bars) — matching the semantics of `getProfessorPointActivity`.

## Notes

- No live updates (unlike `/` and its SSE channel) — both charts are computed once per page load. Revisit with a similar SSE approach (`src/routes/houses/CLAUDE.md`) if this page needs to stay live on a shared screen.
- No nav links to this page yet — reachable by URL only, same as `/professors` today.
