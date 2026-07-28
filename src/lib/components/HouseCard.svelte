<script lang="ts">
	type Status = 'idle' | 'saving' | 'saved' | 'error';

	let {
		name,
		crestSrc,
		points,
		status,
		onIncrement,
		onDecrement
	}: {
		name: string;
		crestSrc: string;
		points: number;
		status: Status;
		onIncrement: () => void;
		onDecrement: () => void;
	} = $props();

	const statusLabel: Record<Status, string> = {
		idle: '',
		saving: 'Saving…',
		saved: 'Saved',
		error: 'Save failed — will retry'
	};
</script>

<li class="card house-row">
	<img class="crest" src={crestSrc} alt="{name} crest" />

	<div class="house-info">
		<span class="house-name">{name}</span>
		<span class="status status-{status}">{statusLabel[status]}</span>
	</div>

	<div class="controls">
		<button
			type="button"
			class="btn btn-outline point-btn"
			aria-label="Subtract a point from {name}"
			onclick={onDecrement}
		>
			&minus;
		</button>
		<span class="points">{points}</span>
		<button
			type="button"
			class="btn btn-primary point-btn"
			aria-label="Add a point to {name}"
			onclick={onIncrement}
		>
			+
		</button>
	</div>
</li>

<style>
	.house-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
	}

	.crest {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.house-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.house-name {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(1.05rem, 3vw, 1.25rem);
		color: var(--color-bark);
	}

	.status {
		font-family: var(--font-accent);
		font-size: 0.75rem;
		color: var(--color-teal);
		min-height: 1em;
	}

	.status-error {
		color: var(--color-rust);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-shrink: 0;
	}

	.point-btn {
		width: 3rem;
		height: 3rem;
		padding: 0;
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.points {
		min-width: 3ch;
		text-align: center;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.375rem;
		color: var(--color-ink);
	}

	@media (max-width: 420px) {
		.house-row {
			flex-wrap: wrap;
		}

		.controls {
			width: 100%;
			justify-content: center;
		}
	}
</style>
