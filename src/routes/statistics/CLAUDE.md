# src/routes/statistics

Guidance for Claude Code when working in this directory.

Covers `/statistics`, a display-only line graph of each house's point total over the last 4 days, built with [layerchart](https://next.layerchart.com).

## Data

`src/lib/server/db/statistics.ts` (`getHousePointsHistory(since)`) reconstructs each house's point total over `[since, now]` from `point_transactions`: it fetches transactions with `createdAt >= since`, sums their deltas, and derives a **baseline** — `clampPoints(house.points - deltaSum)` — which is what the house's total was right at `since`. It then replays the in-window transactions forward from that baseline with the same `clampPoints` helper `applyPointDelta` uses (`src/lib/util/points.ts`). The returned series always starts at `since` and ends at "now", so every house's line spans the full window even with no recent activity.

**Known limitation:** the baseline is derived by subtracting deltas from the current total rather than replaying full history from zero, so it can drift slightly from the true historical value only if clamping (hitting -99/999) happened *inside* the window. Acceptable at this app's scale; a full-history replay would be the fix if it ever matters.

`+page.server.ts` calls this with a fixed `since = now - 4 days` (`WINDOW_DAYS` constant) — there is no period selector UI, by design. Timestamps are serialized to ISO strings for the client.

## Chart — why primitives, not Tailwind

LayerChart's higher-level components style themselves via their own `lc-*` CSS classes (defined in scoped `<style>` blocks using CSS custom properties like `--color-surface-content`, with `currentColor`/`light-dark()` fallbacks) — **not** raw Tailwind utility classes at runtime. `@layerstack/tailwind` is only needed by consumers who want to theme those custom properties through a Tailwind config; it's not required to use the library. Since `--color-surface-content` falls back to `currentColor`, and the app's global `color: var(--color-ink)` on `body` (`src/lib/styles/theme.css`) already cascades down, axis/tick text picks up the theme's ink color for free with zero extra config.

Given that, `HousePointsChart.svelte` uses layerchart's `LineChart` convenience component directly (not hand-assembled `Chart`/`Svg`/`Axis`/`Spline` primitives) rather than avoiding it — it's the more idiomatic use of the library and doesn't require Tailwind either way:

- `series` is one entry per house — `{ key: slug, label: name, color: houseColors[slug], data, value }` — each with its own `data` array (`{ timestamp: Date, points: number }[]`) sourced from `getHousePointsHistory`. `color` comes from `src/lib/assets/house-colors.ts`, the same palette used to tint student names in `TargetPicker`.
- `x` is a shared accessor (`d.timestamp`) with `xScale={scaleTime()}` (from `d3-scale`); `yDomain` is pinned to `[MIN_POINTS, MAX_POINTS]` (`src/lib/util/points.ts`) so the y-axis always reflects the app's actual point bounds, not just the data's range.
- `layerchart/core.css` is imported once (in `HousePointsChart.svelte`) — it only declares the CSS `@layer` cascade order LayerChart's component styles rely on; framework presets (Tailwind, shadcn, skeleton) do this automatically, non-Tailwind consumers import it manually.
- The legend is hand-built (not LayerChart's `Legend`) so it can pair each house's color swatch with its crest (`src/lib/assets/crests.ts`), matching the visual language of `HouseOverviewCard` on the main screen.

## Notes

- No live updates (unlike `/` and its SSE channel) — the chart is computed once per page load. Revisit with a similar SSE approach (`src/routes/houses/CLAUDE.md`) if this page needs to stay live on a shared screen.
- No nav links to this page yet — reachable by URL only, same as `/professors` today.
