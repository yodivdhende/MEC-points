# src/routes/statistics

Guidance for Claude Code when working in this directory.

Covers `/statistics`, a display-only line graph of each house's point total over the last 4 days, built with [layerchart](https://next.layerchart.com).

## Data

`src/lib/server/db/statistics.ts` (`getHousePointsHistory(since)`) reconstructs each house's point total over `[since, now]` from `point_transactions`: it fetches transactions with `createdAt >= since`, sums their deltas, and derives a **baseline** — `clampPoints(house.points - deltaSum)` — which is what the house's total was right at `since`. It then replays the in-window transactions forward from that baseline with the same `clampPoints` helper `applyPointDelta` uses (`src/lib/util/points.ts`). The returned series always starts at `since` and ends at "now", so every house's line spans the full window even with no recent activity.

**Known limitation:** the baseline is derived by subtracting deltas from the current total rather than replaying full history from zero, so it can drift slightly from the true historical value only if clamping (hitting -99/999) happened *inside* the window. Acceptable at this app's scale; a full-history replay would be the fix if it ever matters.

`+page.server.ts` calls this with a fixed `since = now - 4 days` (`WINDOW_DAYS` constant) — there is no period selector UI, by design. Timestamps are serialized to ISO strings for the client. Each point also carries `delta`, `professorName`, `studentName`, and `message` (joined from `professors`/`students`, mirroring the join pattern in `src/lib/server/message-feed.ts`) — populated for real transactions, `null` for the synthetic baseline/"now" points, and used by the chart's hover tooltip.

## Chart — why primitives, not Tailwind

LayerChart's higher-level components style themselves via their own `lc-*` CSS classes (defined in scoped `<style>` blocks using CSS custom properties like `--color-surface-content`, with `currentColor`/`light-dark()` fallbacks) — **not** raw Tailwind utility classes at runtime. `@layerstack/tailwind` is only needed by consumers who want to theme those custom properties through a Tailwind config; it's not required to use the library. Since `--color-surface-content` falls back to `currentColor`, and the app's global `color: var(--color-ink)` on `body` (`src/lib/styles/theme.css`) already cascades down, axis/tick text picks up the theme's ink color for free with zero extra config.

Given that, `HousePointsChart.svelte` uses layerchart's `LineChart` convenience component directly (not hand-assembled `Chart`/`Svg`/`Axis`/`Spline` primitives) rather than avoiding it — it's the more idiomatic use of the library and doesn't require Tailwind either way:

- `series` is one entry per house — `{ key: slug, label: name, color: houseColors[slug], data, value }` — each with its own `data` array (each point stamped with `houseSlug`/`houseName` too, see tooltip note below) sourced from `getHousePointsHistory`. `color` comes from `src/lib/assets/house-colors.ts`, the same palette used to tint student names in `TargetPicker`.
- `x` is a shared accessor (`d.timestamp`) with `xScale={scaleTime()}` (from `d3-scale`); `yDomain`'s lower bound is pinned to `MIN_POINTS` (`src/lib/util/points.ts`, still the real point floor), but the upper bound tracks the highest *current* total across houses (last point in each series) rather than the fixed `MAX_POINTS` ceiling — so the chart zooms to the actual data instead of squashing everything into a sliver near the bottom of a 0..999 axis.
- `layerchart/core.css` is imported once (in `HousePointsChart.svelte`) — it only declares the CSS `@layer` cascade order LayerChart's component styles rely on; framework presets (Tailwind, shadcn, skeleton) do this automatically, non-Tailwind consumers import it manually.
- The legend is hand-built (not LayerChart's `Legend`) so it can pair each house's color swatch with its crest (`src/lib/assets/crests.ts`), matching the visual language of `HouseOverviewCard` on the main screen.

## Hover tooltip

`tooltipContext={{ mode: 'quadtree' }}` switches LineChart's default multi-series-at-one-x tooltip into single-point mode, so hovering finds the *nearest individual data point* (one specific house, one specific moment) rather than every house's value at a shared x position — appropriate here since the extra fields below only make sense per-transaction, not aggregated across houses.

A custom `tooltip` snippet (passed to `LineChart`, overriding its `DefaultTooltip`) is built from LayerChart's own `Tooltip.Root`/`Header`/`List`/`Item` primitives (`import { Tooltip } from 'layerchart'`) and shows: house name + color swatch (header), the point's timestamp, its running total, and — only when present — the transaction's `delta` (`+N`/`-N` via `formatSignedDelta`, `src/lib/util/points.ts`), `professorName`, `studentName`, and `message`. The synthetic baseline/"now" points (and any real transaction missing a field) simply omit those rows.

**Why each point carries `houseSlug`/`houseName` directly** (rather than looking up the hovered series via LayerChart's `context.tooltip.series`/`seriesKey`): the `data` passed to `LineChart` here is our own flat array (`chartSeries.flatMap(s => s.data)`), not LayerChart's internally-derived series data — so the `quadtree` tooltip mode's hit-tested point doesn't come back with LayerChart's own `seriesKey` annotation attached. Stamping the house directly onto each point sidesteps that entirely and is simpler than reconstructing series lookup.

## Notes

- No live updates (unlike `/` and its SSE channel) — the chart is computed once per page load. Revisit with a similar SSE approach (`src/routes/houses/CLAUDE.md`) if this page needs to stay live on a shared screen.
- No nav links to this page yet — reachable by URL only, same as `/professors` today.
