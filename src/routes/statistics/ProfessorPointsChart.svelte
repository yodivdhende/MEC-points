<script lang="ts">
	import { BarChart, Tooltip } from 'layerchart';
	import 'layerchart/core.css';
	import { formatSignedDelta } from '$lib/util/points';

	type ProfessorActivity = {
		professorId: string;
		professorName: string;
		gifted: number;
		subtracted: number;
	};
	type BarPoint = { professorId: string; professorName: string; amount: number };

	let { activity }: { activity: ProfessorActivity[] } = $props();

	// Rust is the app's existing accent color. Plain --color-teal (#2b5672)
	// was tried for "subtracted" but fails the dataviz chroma-floor check
	// (OKLC C 0.067, reads as gray next to rust) — #0d6690 passes all checks
	// paired with rust (CVD ΔE 16.9, normal-vision ΔE 20.6).
	const GIFTED_COLOR = '#7f3d1d';
	const SUBTRACTED_COLOR = '#0d6690';

	// Each series gets its own `data` array (mirroring HousePointsChart's
	// per-house series) rather than a shared `value` accessor: layerchart's
	// grouped horizontal-bar layout derives each series' sub-band position
	// from `series.key`, but if `series.value` is also set it uses that
	// function reference for the lookup instead and the position resolves to
	// NaN. Giving each series its own data (with a shared `amount` field read
	// via the chart's top-level `x` accessor) avoids that path entirely.
	const chartSeries = $derived([
		{
			key: 'gifted',
			label: 'Points gifted',
			color: GIFTED_COLOR,
			data: activity.map((a): BarPoint => ({
				professorId: a.professorId,
				professorName: a.professorName,
				amount: a.gifted
			}))
		},
		{
			key: 'subtracted',
			label: 'Points subtracted',
			color: SUBTRACTED_COLOR,
			data: activity.map((a): BarPoint => ({
				professorId: a.professorId,
				professorName: a.professorName,
				amount: a.subtracted
			}))
		}
	]);

	const allBars = $derived(chartSeries.flatMap((s) => s.data));

	const xDomain = $derived([
		Math.min(0, ...activity.map((a) => a.subtracted)),
		Math.max(0, ...activity.map((a) => a.gifted))
	]);

	const chartHeight = $derived(Math.max(200, activity.length * 48 + 48));

	const activityById = $derived(new Map(activity.map((a) => [a.professorId, a])));

	// layerchart's default left padding (20px, from its defaultChartPadding)
	// assumes short axis labels and doesn't grow to fit real text —
	// professor names would get clipped against the card edge, worst on
	// narrow viewports. Reserve enough left padding for the longest name
	// instead, keeping the other sides at layerchart's own defaults
	// (top: 4, right: 4, bottom: 20 for axis: true, legend: false).
	const longestNameLength = $derived(Math.max(0, ...activity.map((a) => a.professorName.length)));
	const chartPadding = $derived({
		top: 4,
		right: 4,
		bottom: 20,
		left: Math.min(220, Math.max(90, longestNameLength * 7))
	});
</script>

<div class="chart-wrap" style:height="{chartHeight}px">
	<BarChart
		data={allBars}
		x={(d: BarPoint) => d.amount}
		y={(d: BarPoint) => d.professorName}
		orientation="horizontal"
		{xDomain}
		padding={chartPadding}
		series={chartSeries}
		seriesLayout="group"
	>
		{#snippet tooltip({ context })}
			<Tooltip.Root {context}>
				{#snippet children({ data }: { data: BarPoint })}
					{@const row = activityById.get(data.professorId)}
					{#if row}
						<Tooltip.Header value={row.professorName} />
						<Tooltip.List>
							<Tooltip.Item
								label="Points gifted"
								value={formatSignedDelta(row.gifted)}
								color={GIFTED_COLOR}
								valueAlign="right"
							/>
							<Tooltip.Item
								label="Points subtracted"
								value={formatSignedDelta(row.subtracted)}
								color={SUBTRACTED_COLOR}
								valueAlign="right"
							/>
							<Tooltip.Item
								label="Net"
								value={formatSignedDelta(row.gifted + row.subtracted)}
								valueAlign="right"
							/>
						</Tooltip.List>
					{/if}
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</BarChart>
</div>

<ul class="legend">
	<li><span class="swatch" style:--dot={GIFTED_COLOR}></span>Points gifted</li>
	<li><span class="swatch" style:--dot={SUBTRACTED_COLOR}></span>Points subtracted</li>
</ul>

<style>
	.chart-wrap {
		width: 100%;
	}

	.legend {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: var(--space-2) 0 0;
		padding: 0;
		font-family: var(--font-accent);
		font-size: 0.875rem;
	}

	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--dot);
	}
</style>
