<script lang="ts">
	import type { PageData } from './$types';
	import { crests } from '$lib/assets/crests';
	import HouseOverviewCard from '$lib/components/HouseOverviewCard.svelte';
	import backgroundVideo from '$lib/assets/background.mp4';

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
	<!-- svelte-ignore a11y_media_has_caption -->
	<video class="background-video" src={backgroundVideo} autoplay loop muted playsinline></video>
	<ul class="house-row">
		{#each houses as house (house.id)}
			<HouseOverviewCard name={house.name} crestSrc={crests[house.slug]} points={house.points} />
		{/each}
	</ul>
</section>

<style>
	.page {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		padding: var(--space-4);
		overflow: hidden;
	}

	.background-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: -1;
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
