<script lang="ts">
	import PointsCounter from './PointsCounter.svelte';

	let { name, crestSrc, points }: { name: string; crestSrc: string; points: number } = $props();
</script>

<li class="card house-tile">
	<img class="crest" src={crestSrc} alt="{name} crest" />
	<span class="house-name">{name}</span>
	<PointsCounter {points} />
</li>

<style>
	.house-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
		text-align: center;
	}

	.crest {
		width: clamp(4rem, 20vw, 20rem);
		height: clamp(4rem, 20vw, 20rem);
		object-fit: contain;
	}

	.house-name {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(1rem, 1.8vw, 1.5rem);
		color: var(--color-bark);
	}
</style>
