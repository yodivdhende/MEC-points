<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import TargetPicker from '$lib/components/TargetPicker.svelte';
	import type { Target } from '$lib/components/target-picker';
	import { MIN_POINTS, MAX_POINTS } from '$lib/util/points';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let picker: TargetPicker | undefined = $state();
	let target: Target | null = $state(null);
	let delta = $state(0);
	let message = $state('');
	let submitting = $state(false);
	let confirmation: string | null = $state(null);

	const houseId = $derived.by(() => target?.houseId ?? '');
	const canSubmit = $derived(target !== null && delta !== 0 && !submitting);

	function bump(amount: 1 | -1) {
		delta = Math.min(MAX_POINTS, Math.max(MIN_POINTS, delta + amount));
	}
</script>

<section class="page">
	<h1>{data.professor.name}</h1>

	<form
		method="POST"
		action="?/adjust"
		class="adjust-form"
		use:enhance={() => {
			submitting = true;
			confirmation = null;
			const label = target?.label ?? '';
			const submittedDelta = delta;

			return async ({ result, update }) => {
				submitting = false;
				if (result.type === 'success') {
					confirmation = `${submittedDelta > 0 ? '+' : ''}${submittedDelta} to ${label}`;
					target = null;
					delta = 0;
					message = '';
					picker?.reset();
				}
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="houseId" value={houseId} />
		<input
			type="hidden"
			name="studentId"
			value={target?.type === 'student' ? target.studentId : ''}
		/>
		<input type="hidden" name="delta" value={delta} />

		<label class="field">
			<span class="field-label">Student or house</span>
			<TargetPicker
				bind:this={picker}
				houses={data.houses}
				students={data.students}
				bind:selected={target}
			/>
		</label>

		<div class="field">
			<span class="field-label">Points</span>
			<div class="stepper">
				<button type="button" class="btn btn-outline point-btn" onclick={() => bump(-1)}
					>&minus;</button
				>
				<span class="delta" class:negative={delta < 0} class:positive={delta > 0}>
					{delta > 0 ? `+${delta}` : delta}
				</span>
				<button type="button" class="btn btn-primary point-btn" onclick={() => bump(1)}>+</button>
			</div>
		</div>

		<label class="field">
			<span class="field-label">Message <span class="optional">(optional)</span></span>
			<textarea
				name="message"
				bind:value={message}
				maxlength="280"
				rows="3"
				placeholder="What happened? Shown alongside the point change."></textarea>
		</label>

		{#if form?.action === 'adjust' && form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<button type="submit" class="btn btn-primary submit-btn" disabled={!canSubmit}>
			{submitting ? 'Submitting…' : 'Submit'}
		</button>

		{#if confirmation}
			<p class="confirmation">Saved: {confirmation}</p>
		{/if}
	</form>
</section>

<style>
	.page {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
	}

	.adjust-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.field-label {
		font-family: var(--font-accent);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-bark);
	}

	.optional {
		font-weight: 400;
		opacity: 0.7;
	}

	textarea {
		padding: 0.75em 1em;
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		resize: vertical;
		background: var(--color-white);
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.point-btn {
		width: 3rem;
		height: 3rem;
		padding: 0;
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.delta {
		min-width: 4ch;
		text-align: center;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.375rem;
		color: var(--color-ink);
	}

	.delta.positive {
		color: var(--color-teal);
	}

	.delta.negative {
		color: var(--color-rust);
	}

	.submit-btn {
		width: 100%;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		color: var(--color-rust);
		margin: 0;
	}

	.confirmation {
		color: var(--color-teal);
		font-family: var(--font-accent);
		font-size: 0.9375rem;
		margin: 0;
		text-align: center;
	}
</style>
