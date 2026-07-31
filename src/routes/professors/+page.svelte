<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import ProfessorRoster from './ProfessorRoster.svelte';
	import StudentRoster from './StudentRoster.svelte';
	import ResetHousePoints from './ResetHousePoints.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<nav class="statistics-link">
	<a href="/statistics">View statistics →</a>
</nav>

<section class="page">
	<div class="professors">
		<ProfessorRoster active={data.active} inactive={data.inactive} {form} />
	</div>

	<div class="students">
		<StudentRoster students={data.students} houses={data.houses} {form} />
	</div>

	<div class="reset">
		<ResetHousePoints />
	</div>
</section>

<style>
	.statistics-link {
		max-width: 80rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2) 0;
	}

	.page {
		display: grid;
		grid-template:
			'professors students' min-content
			'reset students' min-content
			/ 1fr 1fr;
		gap: 2rem;
		max-width: 80rem;
		margin: 0 auto;
		padding: var(--space-2) var(--space-2) var(--space-4);
	}

	.professors {
		grid-area: professors;
	}

	.students {
		grid-area: students;
	}

	.reset {
		grid-area: reset;
	}

	@media (max-width: 40rem) {
		.page {
			grid-template:
				'professors' min-content
				'students' min-content
				'reset' min-content
				/ 1fr;
			gap: var(--space-4);
		}
	}
</style>
