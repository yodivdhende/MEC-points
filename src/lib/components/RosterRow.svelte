<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		href,
		tag,
		muted = false,
		action
	}: {
		label: string;
		href?: string;
		tag?: string;
		muted?: boolean;
		action: Snippet;
	} = $props();
</script>

<li class="card row" class:muted>
	{#if href}
		<a {href}>{label}</a>
	{:else}
		<span>{label}{#if tag} <span class="tag">({tag})</span>{/if}</span>
	{/if}
	{@render action()}
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2);
	}

	.row.muted {
		opacity: 0.6;
	}

	.tag {
		opacity: 0.7;
		font-size: 0.875rem;
	}
</style>
