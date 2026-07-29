<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { House } from '$lib/server/db/schema';
	import type { StudentWithHouse } from '$lib/server/db/students';
	import RosterRow from '$lib/components/RosterRow.svelte';
	import AddCard from '$lib/components/AddCard.svelte';
	import ConfirmSubmitForm from '$lib/components/ConfirmSubmitForm.svelte';
	import { houseColors } from '$lib/assets/house-colors';

	let {
		students,
		houses,
		form
	}: {
		students: StudentWithHouse[];
		houses: House[];
		form: ActionData;
	} = $props();

	let studentToRemove: { id: string; name: string } | null = $state(null);
</script>

<h1>Students</h1>

<ul class="professor-list">
	{#each students as student (student.id)}
		{#snippet action()}
			<button
				type="button"
				class="btn btn-outline btn-small"
				onclick={() => (studentToRemove = { id: student.id, name: student.name })}
			>
				Remove
			</button>
		{/snippet}
		<RosterRow
			label={student.name}
			tag={student.house.name}
			labelColor={houseColors[student.house.slug]}
			{action}
		/>
	{:else}
		<p>No students yet. Add one below.</p>
	{/each}
</ul>

<ConfirmSubmitForm
	open={studentToRemove !== null}
	action="?/removeStudent"
	hiddenFields={{ id: studentToRemove?.id ?? '' }}
	title="Remove student?"
	message={`This permanently removes ${studentToRemove?.name ?? 'this student'} and cannot be undone.`}
	confirmLabel="Remove student"
	onClose={() => (studentToRemove = null)}
/>

<AddCard
	title="Add Student"
	error={form?.action === 'addStudent' && form?.error ? form.error : undefined}
>
	<form method="POST" action="?/addStudent" use:enhance class="add-form">
		<input type="text" name="name" placeholder="Student name" required />
		<select name="houseId" required>
			<option value="" disabled selected>House</option>
			{#each houses as house (house.id)}
				<option value={house.id}>{house.name}</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-primary">Add Student</button>
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

	.add-form select {
		padding: 0.6em 1em;
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		background: var(--color-white);
	}
</style>
