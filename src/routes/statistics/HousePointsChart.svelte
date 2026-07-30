<script lang="ts">
	import { LineChart, Tooltip } from 'layerchart';
	import 'layerchart/core.css';
	import { scaleTime } from 'd3-scale';
	import { crests } from '$lib/assets/crests';
	import { houseColors } from '$lib/assets/house-colors';
	import { MIN_POINTS, formatSignedDelta } from '$lib/util/points';

	type ChartPoint = {
		timestamp: Date;
		points: number;
		delta: number | null;
		professorName: string | null;
		studentName: string | null;
		message: string | null;
		houseSlug: string;
		houseName: string;
	};
	type HouseSeries = {
		houseId: string;
		slug: string;
		name: string;
		points: {
			timestamp: string;
			points: number;
			delta: number | null;
			professorName: string | null;
			studentName: string | null;
			message: string | null;
		}[];
	};

	let { series }: { series: HouseSeries[] } = $props();

	const chartSeries = $derived(
		series.map((house) => ({
			key: house.slug,
			label: house.name,
			color: houseColors[house.slug],
			data: house.points.map((p): ChartPoint => ({
				...p,
				timestamp: new Date(p.timestamp),
				houseSlug: house.slug,
				houseName: house.name
			})),
			value: (d: ChartPoint) => d.points
		}))
	);

	const allPoints = $derived(chartSeries.flatMap((s) => s.data));

	// Current total = each house's last point in its series (the "now" entry
	// getHousePointsHistory always appends). Only the max is adjusted here —
	// the min stays pinned at MIN_POINTS since -99 is still the point floor.
	const highestCurrentPoints = $derived(
		Math.max(0, ...series.map((house) => house.points.at(-1)?.points ?? 0))
	);

	function xAxisFormat(date: Date) {
		return new Intl.DateTimeFormat('en', { weekday: 'short', hour: 'numeric' }).format(date);
	}

	function tooltipTimeFormat(date: Date) {
		return new Intl.DateTimeFormat('en', {
			weekday: 'short',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date);
	}
</script>

<div class="chart-wrap">
	<LineChart
		data={allPoints}
		x={(d: ChartPoint) => d.timestamp}
		xScale={scaleTime()}
		yDomain={[MIN_POINTS, highestCurrentPoints]}
		series={chartSeries}
		tooltipContext={{ mode: 'quadtree' }}
		props={{
			xAxis: { format: xAxisFormat },
			spline: { strokeWidth: 2.5 }
		}}
	>
		{#snippet tooltip({ context })}
			<Tooltip.Root {context}>
				{#snippet children({ data }: { data: ChartPoint })}
					<Tooltip.Header value={data.houseName} color={houseColors[data.houseSlug]} />
					<Tooltip.List>
						<Tooltip.Item label="When" value={tooltipTimeFormat(data.timestamp)} />
						<Tooltip.Item label="Points" value={data.points} valueAlign="right" />
						{#if data.delta !== null}
							<Tooltip.Item
								label="Change"
								value={formatSignedDelta(data.delta)}
								valueAlign="right"
							/>
						{/if}
						{#if data.professorName}
							<Tooltip.Item label="Professor" value={data.professorName} />
						{/if}
						{#if data.studentName}
							<Tooltip.Item label="Student" value={data.studentName} />
						{/if}
						{#if data.message}
							<Tooltip.Item label="Message" value={data.message} />
						{/if}
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</LineChart>
</div>

<ul class="legend">
	{#each series as house (house.houseId)}
		<li>
			<img src={crests[house.slug]} alt="" class="crest" />
			<span class="swatch" style:--dot={houseColors[house.slug]}></span>
			{house.name}
		</li>
	{/each}
</ul>

<style>
	.chart-wrap {
		height: 24rem;
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

	.crest {
		width: 1.25rem;
		height: 1.25rem;
		object-fit: contain;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--dot);
	}
</style>
