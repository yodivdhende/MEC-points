<script lang="ts">
	import { fade } from 'svelte/transition';
	import { formatSignedDelta } from '$lib/util/points';

	let {
		houseName,
		crestSrc,
		professorName,
		studentName,
		delta,
		message,
		fadeMs = 500
	}: {
		houseName: string;
		crestSrc: string;
		professorName: string | null;
		studentName: string | null;
		delta: number;
		message: string;
		fadeMs?: number;
	} = $props();
</script>

<div class="card banner" transition:fade={{ duration: fadeMs }}>
	<img class="banner-crest" src={crestSrc} alt="{houseName} crest" />
	<div class="banner-names">
		<strong>{professorName ?? 'Reset'}</strong>
		<span class="banner-arrow">→</span>
		{#if studentName}
			<strong>{studentName}</strong>
		{:else}
			<em>{houseName}</em> (whole house)
		{/if}
	</div>
	<span class="banner-delta" class:positive={delta > 0} class:negative={delta < 0}>
		{formatSignedDelta(delta)}
	</span>
	<p class="banner-message">&ldquo;{message}&rdquo;</p>
</div>

<style>
	.banner {
		grid-area: messages;
		display: grid;
		grid-template:
			'crest names' min-content
			'crest delta' min-content
			'crest message' min-content
			/ min-content 1fr;
		align-items: center;
		column-gap: 1em;
		max-width: min(90vw, 60rem);
		padding: 1em;
		padding-right: 1.5em;
	}

	.banner-crest {
		grid-area: crest;
		width: clamp(2rem, 6vw, 10rem);
		height: clamp(2rem, 6vw, 10rem);
		object-fit: contain;
		flex-shrink: 0;
	}

	.banner-names {
		grid-area: names;
		display: flex;
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(0.9rem, 1.6vw, 1.25rem);
		color: var(--color-bark);
	}

	.banner-delta {
		grid-area: delta;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		font-size: 1.2 em;
		font-weight: bold;
		justify-self: center;
	}

	.banner-delta.positive {
		color: var(--color-teal);
	}

	.banner-delta.negative {
		color: var(--color-rust);
	}

	.banner-message {
		grid-area: message;
		font-family: var(--font-body);
		font-style: italic;
		font-size: clamp(0.8rem, 1.3vw, 1.1rem);
		color: var(--color-ink);
		margin: 0.15em 0 0;
		overflow-wrap: break-word;
		word-break: break-word;
	}
</style>
