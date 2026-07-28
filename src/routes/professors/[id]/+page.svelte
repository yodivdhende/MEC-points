<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { HousePoints } from '$lib/state/house-points.svelte';
	import HouseCard from '$lib/components/HouseCard.svelte';
	import alcertis from '$lib/assets/Alcertis colour_PNG.png';
	import ibidens from '$lib/assets/Ibidens colour_PNG.png';
	import lutridus from '$lib/assets/Lutridus colour_PNG.png';
	import paventia from '$lib/assets/Paventia colour_PNG.png';
	import luvium from '$lib/assets/Luvium colour_PNG.png';

	const crests: Record<string, string> = { alcertis, ibidens, lutridus, paventia, luvium };

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
	<span class="eyebrow">Point submission</span>
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

	.house-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
