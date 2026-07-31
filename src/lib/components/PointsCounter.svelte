<script lang="ts">
	import { formatPoints } from '$lib/util/points';
	import PointsCounterDigit from './PointsCounterDigit.svelte';

	let { points }: { points: number } = $props();

	let previousPoints = points;
	let direction = $state<1 | -1>(1);

	$effect.pre(() => {
		direction = points >= previousPoints ? 1 : -1;
		previousPoints = points;
	});

	let chars = $derived(formatPoints(points).split(''));
</script>

<div class="counter">
	{#each chars as char, i (i)}
		<span class="cell-wrapper" class:divider={i > 0}>
			<PointsCounterDigit {char} {direction} />
		</span>
	{/each}
</div>

<style>
	.counter {
		display: inline-flex;
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		font-size: clamp(2rem, 5vw, 4rem);
		color: var(--color-ink);
		background: var(--color-parchment);
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.cell-wrapper {
		padding: 0.1em;
	}

	.cell-wrapper.divider {
		border-left: 1px solid var(--color-tan);
	}
</style>
