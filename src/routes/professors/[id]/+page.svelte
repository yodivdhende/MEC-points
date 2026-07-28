<script lang="ts">
	import { deserialize } from '$app/forms';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { clampPoints } from '$lib/points';
	import alcertis from '$lib/assets/Alcertis colour_PNG.png';
	import ibidens from '$lib/assets/Ibidens colour_PNG.png';
	import lutridus from '$lib/assets/Lutridus colour_PNG.png';
	import paventia from '$lib/assets/Paventia colour_PNG.png';
	import luvium from '$lib/assets/Luvium colour_PNG.png';

	const crests: Record<string, string> = { alcertis, ibidens, lutridus, paventia, luvium };

	let { data }: { data: PageData } = $props();

	const DEBOUNCE_MS = 5000;

	type HouseRow = {
		id: number;
		name: string;
		slug: string;
		baseline: number;
		displayed: number;
		pendingDelta: number;
		status: 'idle' | 'saving' | 'saved' | 'error';
		timer: ReturnType<typeof setTimeout> | null;
	};

	let houseRows = $state<HouseRow[]>(
		data.houses.map((house) => ({
			id: house.id,
			name: house.name,
			slug: house.slug,
			baseline: house.points,
			displayed: house.points,
			pendingDelta: 0,
			status: 'idle',
			timer: null
		}))
	);

	function bump(house: HouseRow, amount: 1 | -1) {
		house.pendingDelta += amount;
		house.displayed = clampPoints(house.baseline + house.pendingDelta);
		house.status = 'idle';
		if (house.timer) clearTimeout(house.timer);
		house.timer = setTimeout(() => flush(house), DEBOUNCE_MS);
	}

	async function flush(house: HouseRow) {
		house.timer = null;
		if (house.pendingDelta === 0) return;

		const delta = house.pendingDelta;
		house.pendingDelta = 0;
		house.status = 'saving';

		const body = new FormData();
		body.set('houseId', String(house.id));
		body.set('delta', String(delta));

		try {
			const response = await fetch('?/adjust', { method: 'POST', body, keepalive: true });
			const result = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				house.baseline = result.data.points as number;
				house.displayed = clampPoints(house.baseline + house.pendingDelta);
				house.status = 'saved';
				setTimeout(() => {
					if (house.status === 'saved') house.status = 'idle';
				}, 2000);
			} else {
				throw new Error('Save failed');
			}
		} catch {
			house.pendingDelta += delta;
			house.displayed = clampPoints(house.baseline + house.pendingDelta);
			house.status = 'error';
		}
	}

	function flushAllOnUnload() {
		for (const house of houseRows) {
			if (house.timer) clearTimeout(house.timer);
			if (house.pendingDelta === 0) continue;
			const body = new FormData();
			body.set('houseId', String(house.id));
			body.set('delta', String(house.pendingDelta));
			navigator.sendBeacon('?/adjust', body);
			house.pendingDelta = 0;
		}
	}

	$effect(() => {
		window.addEventListener('beforeunload', flushAllOnUnload);
		window.addEventListener('pagehide', flushAllOnUnload);
		return () => {
			window.removeEventListener('beforeunload', flushAllOnUnload);
			window.removeEventListener('pagehide', flushAllOnUnload);
		};
	});

	onDestroy(() => {
		for (const house of houseRows) {
			if (house.timer) clearTimeout(house.timer);
		}
	});

	const statusLabel: Record<HouseRow['status'], string> = {
		idle: '',
		saving: 'Saving…',
		saved: 'Saved',
		error: 'Save failed — will retry'
	};
</script>

<section class="page">
	<span class="eyebrow">Point submission</span>
	<h1>{data.professor.name}</h1>

	<ul class="house-list">
		{#each houseRows as house (house.id)}
			<li class="card house-row">
				<img class="crest" src={crests[house.slug]} alt="{house.name} crest" />

				<div class="house-info">
					<span class="house-name">{house.name}</span>
					<span class="status status-{house.status}">{statusLabel[house.status]}</span>
				</div>

				<div class="controls">
					<button
						type="button"
						class="btn btn-outline point-btn"
						aria-label="Subtract a point from {house.name}"
						onclick={() => bump(house, -1)}
					>
						&minus;
					</button>
					<span class="points">{house.displayed}</span>
					<button
						type="button"
						class="btn btn-primary point-btn"
						aria-label="Add a point to {house.name}"
						onclick={() => bump(house, 1)}
					>
						+
					</button>
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	.page {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-2);
	}

	.house-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

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
