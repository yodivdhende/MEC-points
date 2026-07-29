<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		error,
		children
	}: {
		title: string;
		error?: string;
		children: Snippet;
	} = $props();
</script>

<div class="card add-card">
	<h3>{title}</h3>
	{@render children()}
	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.add-card {
		margin-bottom: var(--space-3);
	}

	.error {
		color: var(--color-rust);
		margin: var(--space-1) 0 0;
	}
</style>
