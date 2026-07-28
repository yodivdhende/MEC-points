<script lang="ts">
	import { formatPoints } from '$lib/util/points';

	let { name, crestSrc, points }: { name: string; crestSrc: string; points: number } = $props();
</script>

<li class="card house-tile">
	<img class="crest" src={crestSrc} alt="{name} crest" />
	<span class="house-name">{name}</span>
	<span class="points">{formatPoints(points)}</span>
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
		width: clamp(4rem, 10vw, 9rem);
		height: clamp(4rem, 10vw, 9rem);
		object-fit: contain;
	}

	.house-name {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(1rem, 1.8vw, 1.5rem);
		color: var(--color-bark);
	}

	.points {
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		font-size: clamp(2rem, 5vw, 4rem);
		color: var(--color-ink);
		background: var(--color-parchment);
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		padding: 0.1em 0.3em;
		min-width: 3ch;
	}
</style>
