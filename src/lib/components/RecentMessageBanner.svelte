<script lang="ts">
	import { formatSignedDelta } from '$lib/util/points';

	let {
		houseName,
		crestSrc,
		professorName,
		studentName,
		delta,
		message
	}: {
		houseName: string;
		crestSrc: string;
		professorName: string | null;
		studentName: string | null;
		delta: number;
		message: string;
	} = $props();
</script>

<div class="card message-banner">
	<img class="banner-crest" src={crestSrc} alt="{houseName} crest" />
	<div class="banner-body">
		<p class="banner-line">
			<strong>{professorName ?? 'Reset'}</strong>
			<span class="banner-arrow">→</span>
			{#if studentName}
				<strong>{studentName}</strong>
			{:else}
				<em>{houseName}</em> (whole house)
			{/if}
			<span class="banner-delta" class:positive={delta > 0} class:negative={delta < 0}>
				{formatSignedDelta(delta)}
			</span>
		</p>
		<p class="banner-message">&ldquo;{message}&rdquo;</p>
	</div>
</div>

<style>
	.message-banner {
		position: absolute;
		left: 50%;
		bottom: var(--space-3);
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		max-width: min(90vw, 60rem);
	}

	.banner-crest {
		width: clamp(2rem, 4vw, 3.5rem);
		height: clamp(2rem, 4vw, 3.5rem);
		object-fit: contain;
		flex-shrink: 0;
	}

	.banner-body {
		min-width: 0;
	}

	.banner-line {
		font-family: var(--font-display);
		font-size: clamp(0.9rem, 1.6vw, 1.25rem);
		color: var(--color-bark);
		margin: 0;
	}

	.banner-delta {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.banner-delta.positive {
		color: var(--color-teal);
	}

	.banner-delta.negative {
		color: var(--color-rust);
	}

	.banner-message {
		font-family: var(--font-body);
		font-style: italic;
		font-size: clamp(0.8rem, 1.3vw, 1.1rem);
		color: var(--color-ink);
		margin: 0.15em 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
