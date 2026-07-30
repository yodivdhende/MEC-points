<script lang="ts">
	import { LineChart } from 'layerchart';
	import 'layerchart/core.css';
	import { scaleTime } from 'd3-scale';
	import { crests } from '$lib/assets/crests';
	import { houseColors } from '$lib/assets/house-colors';
	import { MIN_POINTS, MAX_POINTS } from '$lib/util/points';

	type ChartPoint = { timestamp: Date; points: number };
	type HouseSeries = {
		houseId: string;
		slug: string;
		name: string;
		points: { timestamp: string; points: number }[];
	};

	let { series }: { series: HouseSeries[] } = $props();

	const chartSeries = $derived(
		series.map((house) => ({
			key: house.slug,
			label: house.name,
			color: houseColors[house.slug],
			data: house.points.map((p): ChartPoint => ({
				timestamp: new Date(p.timestamp),
				points: p.points
			})),
			value: (d: ChartPoint) => d.points
		}))
	);

	const allPoints = $derived(chartSeries.flatMap((s) => s.data));

	function xAxisFormat(date: Date) {
		return new Intl.DateTimeFormat('en', { weekday: 'short', hour: 'numeric' }).format(date);
	}
</script>

<div class="chart-wrap">
	<LineChart
		data={allPoints}
		x={(d: ChartPoint) => d.timestamp}
		xScale={scaleTime()}
		yDomain={[MIN_POINTS, MAX_POINTS]}
		series={chartSeries}
		props={{
			xAxis: { format: xAxisFormat },
			spline: { strokeWidth: 2.5 }
		}}
	/>
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
