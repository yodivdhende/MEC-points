<script lang="ts">
	import type { PageData } from './$types';
	import HousePointsChart from './HousePointsChart.svelte';
	import ProfessorPointsChart from './ProfessorPointsChart.svelte';

	let { data }: { data: PageData } = $props();
</script>

<section class="page">
	<div class="card">
		<span class="eyebrow">Statistics</span>
		<h1>House points, last 4 days</h1>
		<HousePointsChart series={data.series} />
	</div>

	<div class="card">
		<span class="eyebrow">Statistics</span>
		<h2>Professor activity, last 4 days</h2>
		<ProfessorPointsChart activity={data.professorActivity} />
	</div>
</section>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
