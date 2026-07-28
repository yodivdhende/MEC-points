<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<section class="page">
	<span class="eyebrow">Point submission</span>
	<h1>{data.professor.name}</h1>
	<div class="card">
		<p>Point submission coming soon.</p>
	</div>
</section>

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
	}
</style>
