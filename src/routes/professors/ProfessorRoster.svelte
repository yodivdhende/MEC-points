<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { Professor } from '$lib/server/db/schema';
	import RosterRow from '$lib/components/RosterRow.svelte';
	import AddCard from '$lib/components/AddCard.svelte';

	let {
		active,
		inactive,
		form
	}: {
		active: Professor[];
		inactive: Professor[];
		form: ActionData;
	} = $props();

	let showDeactivated = $state(false);
</script>

<h1>Professors</h1>

<ul class="professor-list">
	{#each active as professor (professor.id)}
		{#snippet action()}
			<form method="POST" action="?/deactivate" use:enhance>
				<input type="hidden" name="id" value={professor.id} />
				<button type="submit" class="btn btn-outline btn-small">Deactivate</button>
			</form>
		{/snippet}
		<RosterRow label={professor.name} href="/professors/{professor.id}" {action} />
	{:else}
		<p>No professors yet. Add one above.</p>
	{/each}
</ul>

{#if inactive.length > 0}
	<button type="button" class="expand-toggle" onclick={() => (showDeactivated = !showDeactivated)}>
		{showDeactivated ? 'Hide' : 'Show'} deactivated professors ({inactive.length})
	</button>

	{#if showDeactivated}
		<ul class="professor-list deactivated">
			{#each inactive as professor (professor.id)}
				{#snippet action()}
					<form method="POST" action="?/reactivate" use:enhance>
						<input type="hidden" name="id" value={professor.id} />
						<button type="submit" class="btn btn-outline btn-small">Reactivate</button>
					</form>
				{/snippet}
				<RosterRow label={professor.name} muted {action} />
			{/each}
		</ul>
	{/if}
{/if}

<AddCard title="Add Professor" error={form?.action === 'add' && form?.error ? form.error : undefined}>
	<form method="POST" action="?/add" use:enhance class="add-form">
		<input type="text" name="name" placeholder="Professor name" required />
		<button type="submit" class="btn btn-primary">Add Professor</button>
	</form>
</AddCard>

<style>
	.professor-list {
		list-style: none;
		margin: 0 0 var(--space-3);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
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
