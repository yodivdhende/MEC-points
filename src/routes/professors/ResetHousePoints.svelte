<script lang="ts">
	import ConfirmSubmitForm from '$lib/components/ConfirmSubmitForm.svelte';

	let showResetConfirm = $state(false);
</script>

<div class="card reset-card">
	<h3>Reset house points</h3>
	<p>Zero out every house's point total, e.g. at the end of a school year.</p>
	<button type="button" class="btn btn-danger-outline" onclick={() => (showResetConfirm = true)}>
		Reset all house points
	</button>
</div>

<ConfirmSubmitForm
	open={showResetConfirm}
	action="?/resetAll"
	title="Reset all house points?"
	message="This sets every house's point total back to 0 and cannot be undone."
	confirmLabel="Reset points"
	onClose={() => (showResetConfirm = false)}
/>

<style>
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
</style>
