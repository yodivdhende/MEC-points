<script lang="ts">
	let {
		open,
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		onConfirm,
		onCancel
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		if (!open && dialogEl.open) dialogEl.close();
	});
</script>

<dialog bind:this={dialogEl} class="confirm-dialog" onclose={onCancel} oncancel={onCancel}>
	<h3>{title}</h3>
	<p>{message}</p>
	<div class="actions">
		<button type="button" class="btn btn-outline" onclick={onCancel}>{cancelLabel}</button>
		<button type="button" class="btn btn-danger" onclick={onConfirm}>{confirmLabel}</button>
	</div>
</dialog>

<style>
	.confirm-dialog {
		max-width: 28rem;
		width: calc(100% - var(--space-3));
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: var(--space-3);
		background: var(--color-parchment-light);
		color: var(--color-ink);
		font-family: var(--font-body);
	}

	.confirm-dialog::backdrop {
		background: rgba(57, 27, 15, 0.45);
	}

	.confirm-dialog h3 {
		margin-top: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}

	.btn-danger {
		background: var(--color-rust);
		color: var(--color-white);
	}

	.btn-danger:hover {
		background: var(--color-bark);
	}
</style>
