<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { HousePoints } from '$lib/state/house-points.svelte';
	import HouseCard from '$lib/components/HouseCard.svelte';
	import { crests } from '$lib/assets/crests';

	let { data }: { data: PageData } = $props();

	const houses = data.houses.map((house) => new HousePoints(house));

	function flushAllOnUnload() {
		for (const house of houses) house.flushOnUnload();
	}

	$effect(() => {
		window.addEventListener('beforeunload', flushAllOnUnload);
		window.addEventListener('pagehide', flushAllOnUnload);
		return () => {
			window.removeEventListener('beforeunload', flushAllOnUnload);
			window.removeEventListener('pagehide', flushAllOnUnload);
		};
	});

	onDestroy(() => {
		for (const house of houses) house.destroy();
	});
</script>

<section class="page">
	<a href="/professors" class="back-link eyebrow">&larr; Back to professors</a>
	<h1>{data.professor.name}</h1>

	<ul class="house-list">
		{#each houses as house (house.id)}
			<HouseCard
				name={house.name}
				crestSrc={crests[house.slug]}
				points={house.displayed}
				status={house.status}
				onIncrement={() => house.bump(1)}
				onDecrement={() => house.bump(-1)}
			/>
		{/each}
	</ul>
</section>

<style>
	.page {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
	}

	.back-link {
		display: inline-block;
		font-size: 0.875rem;
		margin-bottom: var(--space-2);
	}

	.house-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
