<script lang="ts">
	import { deserialize } from '$app/forms';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { clampPoints } from '$lib/util/points';
	import HouseCard from '$lib/components/HouseCard.svelte';
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
</script>

<section class="page">
	<span class="eyebrow">Point submission</span>
	<h1>{data.professor.name}</h1>

	<ul class="house-list">
		{#each houseRows as house (house.id)}
			<HouseCard
				name={house.name}
				crestSrc={crests[house.slug]}
				points={house.displayed}
				status={house.status}
				onIncrement={() => bump(house, 1)}
				onDecrement={() => bump(house, -1)}
			/>
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
</style>
