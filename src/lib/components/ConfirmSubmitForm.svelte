<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let {
		open,
		action,
		hiddenFields = {},
		title,
		message,
		confirmLabel,
		onClose
	}: {
		open: boolean;
		action: string;
		hiddenFields?: Record<string, string>;
		title: string;
		message: string;
		confirmLabel?: string;
		onClose: () => void;
	} = $props();

	let formEl: HTMLFormElement | undefined = $state();
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		return async ({ update }) => {
			await update();
			onClose();
		};
	}}
	bind:this={formEl}
>
	{#each Object.entries(hiddenFields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
</form>

<ConfirmDialog
	{open}
	{title}
	{message}
	{confirmLabel}
	onConfirm={() => formEl?.requestSubmit()}
	onCancel={onClose}
/>
