<script lang="ts">
	import type { PageData } from './$types';
	import { crests } from '$lib/assets/crests';
	import HouseOverviewCard from '$lib/components/HouseOverviewCard.svelte';

	let { data }: { data: PageData } = $props();

	const houses = $state(data.houses.map((house) => ({ ...house })));

	$effect(() => {
		const source = new EventSource('/houses/events');
		source.onmessage = (event) => {
			const update = JSON.parse(event.data) as { id: string; points: number };
			const house = houses.find((h) => h.id === update.id);
			if (house) house.points = update.points;
		};
		return () => source.close();
	});
</script>

<section class="page">
	<ul class="house-row">
		{#each houses as house (house.id)}
			<HouseOverviewCard name={house.name} crestSrc={crests[house.slug]} points={house.points} />
		{/each}
	</ul>
</section>

<style>
	.page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		padding: var(--space-4);
	}

	.house-row {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
	}
</style>
