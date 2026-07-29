<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showDeactivated = $state(false);
	let showResetConfirm = $state(false);
	let resetForm: HTMLFormElement | undefined = $state();

	let studentToRemove: { id: string; name: string } | null = $state(null);
	let removeStudentForm: HTMLFormElement | undefined = $state();
</script>

<section class="page">
	<h1>Professors</h1>

	<form
		method="POST"
		action="?/resetAll"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				showResetConfirm = false;
			};
		}}
		bind:this={resetForm}
	></form>

	<ConfirmDialog
		open={showResetConfirm}
		title="Reset all house points?"
		message="This sets every house's point total back to 0 and cannot be undone."
		confirmLabel="Reset points"
		onConfirm={() => resetForm?.requestSubmit()}
		onCancel={() => (showResetConfirm = false)}
	/>

	<form
		method="POST"
		action="?/removeStudent"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				studentToRemove = null;
			};
		}}
		bind:this={removeStudentForm}
	>
		<input type="hidden" name="id" value={studentToRemove?.id ?? ''} />
	</form>

	<ConfirmDialog
		open={studentToRemove !== null}
		title="Remove student?"
		message={`This permanently removes ${studentToRemove?.name ?? 'this student'} and cannot be undone.`}
		confirmLabel="Remove student"
		onConfirm={() => removeStudentForm?.requestSubmit()}
		onCancel={() => (studentToRemove = null)}
	/>

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

	<h2>Students</h2>

	<ul class="professor-list">
		{#each data.students as student (student.id)}
			<li class="card professor-row">
				<span>{student.name} <span class="house-tag">({student.house.name})</span></span>
				<button
					type="button"
					class="btn btn-outline btn-small"
					onclick={() => (studentToRemove = { id: student.id, name: student.name })}
				>
					Remove
				</button>
			</li>
		{:else}
			<p>No students yet. Add one below.</p>
		{/each}
	</ul>

	<div class="card add-card">
		<h3>Add Student</h3>
		<form method="POST" action="?/addStudent" use:enhance class="add-form">
			<input type="text" name="name" placeholder="Student name" required />
			<select name="houseId" required>
				<option value="" disabled selected>House</option>
				{#each data.houses as house (house.id)}
					<option value={house.id}>{house.name}</option>
				{/each}
			</select>
			<button type="submit" class="btn btn-primary">Add Student</button>
		</form>
		{#if form?.action === 'addStudent' && form?.error}
			<p class="error">{form.error}</p>
		{/if}
	</div>

	<div class="card reset-card">
		<h3>Reset house points</h3>
		<p>Zero out every house's point total, e.g. at the end of a school year.</p>
		<button type="button" class="btn btn-danger-outline" onclick={() => (showResetConfirm = true)}>
			Reset all house points
		</button>
	</div>
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

	.reset-card {
		margin-bottom: var(--space-3);
	}

	.btn-danger-outline {
		background: transparent;
		color: var(--color-rust);
		border-color: var(--color-rust);
	}

	.btn-danger-outline:hover {
		background: var(--color-rust);
		color: var(--color-white);
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

	.add-form select {
		padding: 0.6em 1em;
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		background: var(--color-white);
	}

	.house-tag {
		opacity: 0.7;
		font-size: 0.875rem;
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
