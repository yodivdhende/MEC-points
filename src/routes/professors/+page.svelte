<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showDeactivated = $state(false);
</script>

<section class="page">
	<span class="eyebrow">Faculty</span>
	<h1>Professors</h1>

	<div class="card add-card">
		<h3>Add Professor</h3>
		<form method="POST" action="?/add" use:enhance class="add-form">
			<input type="text" name="name" placeholder="Professor name" required />
			<button type="submit" class="btn btn-primary">Add Professor</button>
		</form>
		{#if form?.action === 'add' && form?.error}
			<p class="error">{form.error}</p>
		{/if}
	</div>

	<ul class="professor-list">
		{#each data.active as professor (professor.id)}
			<li class="card professor-row">
				<a href="/professors/{professor.id}">{professor.name}</a>
				<form method="POST" action="?/deactivate" use:enhance>
					<input type="hidden" name="id" value={professor.id} />
					<button type="submit" class="btn btn-outline btn-small">Deactivate</button>
				</form>
			</li>
		{:else}
			<p>No professors yet. Add one above.</p>
		{/each}
	</ul>

	{#if data.inactive.length > 0}
		<button
			type="button"
			class="expand-toggle"
			onclick={() => (showDeactivated = !showDeactivated)}
		>
			{showDeactivated ? 'Hide' : 'Show'} deactivated professors ({data.inactive.length})
		</button>

		{#if showDeactivated}
			<ul class="professor-list deactivated">
				{#each data.inactive as professor (professor.id)}
					<li class="card professor-row muted">
						<span>{professor.name}</span>
						<form method="POST" action="?/reactivate" use:enhance>
							<input type="hidden" name="id" value={professor.id} />
							<button type="submit" class="btn btn-outline btn-small">Reactivate</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
	}

	.add-card {
		margin-bottom: var(--space-3);
	}

	.add-form {
		display: flex;
		gap: var(--space-1);
	}

	.add-form input {
		flex: 1;
		padding: 0.6em 1em;
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
	}

	.error {
		color: var(--color-rust);
		margin: var(--space-1) 0 0;
	}

	.professor-list {
		list-style: none;
		margin: 0 0 var(--space-3);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.professor-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2);
	}

	.professor-row.muted {
		opacity: 0.6;
	}

	.btn-small {
		padding: 0.4em 1.1em;
		font-size: 0.8125rem;
	}

	.expand-toggle {
		background: none;
		border: none;
		color: var(--color-teal);
		font-family: var(--font-accent);
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0;
		margin-bottom: var(--space-2);
	}
</style>
