<script lang="ts">
	import type { House } from '$lib/server/db/schema';
	import type { StudentWithHouse } from '$lib/server/db/students';
	import type { Target } from './target-picker';
	import { crests } from '$lib/assets/crests';
	import { houseColors } from '$lib/assets/house-colors';

	let {
		houses,
		students,
		selected = $bindable(null)
	}: {
		houses: House[];
		students: StudentWithHouse[];
		selected: Target | null;
	} = $props();

	let query = $state('');
	let open = $state(false);
	let activeIndex = $state(-1);
	let rootEl: HTMLDivElement | undefined = $state();

	const options = $derived<Target[]>([
		...houses.map((house) => ({
			type: 'house' as const,
			houseId: house.id,
			slug: house.slug,
			label: `${house.name} (whole house)`
		})),
		...students.map((student) => ({
			type: 'student' as const,
			studentId: student.id,
			houseId: student.houseId,
			slug: student.house.slug,
			label: student.name
		}))
	]);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return q ? options.filter((option) => option.label.toLowerCase().includes(q)) : options;
	});

	function optionKey(option: Target) {
		return option.type === 'house' ? `house:${option.houseId}` : `student:${option.studentId}`;
	}

	function selectOption(option: Target) {
		selected = option;
		query = option.label;
		open = false;
		activeIndex = -1;
	}

	function onInput() {
		selected = null;
		open = true;
		activeIndex = -1;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
			open = true;
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === 'Enter') {
			if (open && activeIndex >= 0 && filtered[activeIndex]) {
				event.preventDefault();
				selectOption(filtered[activeIndex]);
			}
		} else if (event.key === 'Escape') {
			open = false;
			activeIndex = -1;
		}
	}

	function onFocusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (rootEl && next && rootEl.contains(next)) return;
		open = false;
		query = selected?.label ?? '';
	}

	export function reset() {
		selected = null;
		query = '';
	}
</script>

<div class="picker" bind:this={rootEl} onfocusout={onFocusOut}>
	<input
		type="text"
		role="combobox"
		aria-expanded={open}
		aria-controls="target-listbox"
		aria-autocomplete="list"
		autocomplete="off"
		placeholder="Search a student or house…"
		bind:value={query}
		oninput={onInput}
		onfocus={() => (open = true)}
		onkeydown={onKeydown}
	/>

	{#if open}
		<ul id="target-listbox" role="listbox" class="options">
			{#each filtered as option, index (optionKey(option))}
				<li role="none">
					<button
						type="button"
						role="option"
						aria-selected={index === activeIndex}
						class="option"
						class:active={index === activeIndex}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => selectOption(option)}
					>
						<img class="crest-icon" src={crests[option.slug]} alt="" />
						<span
							class="option-label"
							style={option.type === 'student' ? `color: ${houseColors[option.slug]}` : ''}
						>
							{option.label}
						</span>
					</button>
				</li>
			{:else}
				<li class="empty">No matches</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}

	input {
		width: 100%;
		padding: 0.75em 1em;
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 1rem;
		background: var(--color-white);
	}

	.options {
		position: absolute;
		z-index: 10;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		max-height: 16rem;
		overflow-y: auto;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		background: var(--color-white);
		border: 1px solid var(--color-tan);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-card);
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		padding: 0.5em 0.6em;
		border: none;
		background: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		text-align: left;
		cursor: pointer;
		color: var(--color-ink);
	}

	.option.active,
	.option:hover {
		background: var(--color-parchment);
	}

	.crest-icon {
		width: 1.5rem;
		height: 1.5rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.option-label {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty {
		padding: 0.6em;
		color: var(--color-tan);
		font-size: 0.875rem;
	}
</style>
