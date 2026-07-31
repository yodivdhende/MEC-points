<script lang="ts">
	import { fly } from 'svelte/transition';

	let { char, direction }: { char: string; direction: 1 | -1 } = $props();

	let previousChar = char;
	let entryOffset = $state(0);

	$effect.pre(() => {
		const isSignChange = char !== previousChar && (char === '-' || previousChar === '-');
		entryOffset = isSignChange ? 0 : direction === 1 ? 16 : -16;
		previousChar = char;
	});
</script>

<span class="cell">
	{#key char}
		<span
			class="glyph"
			in:fly={{ y: entryOffset, duration: 280 }}
			out:fly={{ y: -entryOffset, duration: 280 }}
		>{char}</span>
	{/key}
</span>

<style>
	.cell {
		position: relative;
		display: block;
		overflow: hidden;
		width: 1ch;
		height: 1.2em;
		line-height: 1.2em;
	}

	.glyph {
		position: absolute;
		inset: 0;
		text-align: center;
	}
</style>
