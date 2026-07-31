<script lang="ts">
	import { fly } from 'svelte/transition';

	let { char, direction }: { char: string; direction: 1 | -1 } = $props();

	let previouschar = char;
	let entryoffset = $state(0);
	let duration = 1000;

	$effect.pre(() => {
		const issignchange = char !== previouschar && (char === '-' || previouschar === '-');
		entryoffset = issignchange ? 0 : direction === 1 ? 16 : -16;
		previouschar = char;
	});
</script>

<span class="cell">
	{#key char}
		<span
			class="glyph"
			in:fly={{ y: entryoffset, duration }}
			out:fly={{ y: -entryoffset, duration }}>{char}</span
		>
	{/key}
</span>

<style>
	.cell {
		position: relative;
		display: block;
		overflow: hidden;
		width: 1ch;
		height: 1.2em;
		line-height: 0.9em;
	}

	.glyph {
		position: absolute;
		inset: 0;
		text-align: center;
	}
</style>
