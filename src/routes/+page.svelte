<script lang="ts">
	import type { PageData } from './$types';
	import { crests } from '$lib/assets/crests';
	import HouseOverviewCard from '$lib/components/HouseOverviewCard.svelte';
	import RecentMessageBanner from '$lib/components/RecentMessageBanner.svelte';
	import backgroundVideo from '$lib/assets/background.mp4';
	import backgroundImage from '$lib/assets/background.png';

	const BANNER_FADE_MS = 500;
	const BANNER_GAP_MS = 500;

	type FeedMessage = {
		id: string;
		houseSlug: string;
		houseName: string;
		professorName: string | null;
		studentName: string | null;
		delta: number;
		message: string;
		createdAt: string;
	};

	type HouseSseEvent = { type: 'house'; id: string; slug: string; points: number };
	type MessageSseEvent = FeedMessage & { type: 'message' };

	const ROTATION_INTERVAL_MS = 20_000;
	const EXPIRY_WINDOW_MS = 2 * 60 * 60 * 1000;

	let { data }: { data: PageData } = $props();

	const houses = $state(data.houses.map((house) => ({ ...house })));
	let messages = $state<FeedMessage[]>(data.messages);
	let currentIndex = $state(0);
	let bannerVisible = $state(true);

	let videoFailed = $state(false);

	const currentMessage = $derived(messages[currentIndex] ?? null);

	$effect(() => {
		const source = new EventSource('/houses/events');
		source.onmessage = (event) => {
			const update = JSON.parse(event.data) as HouseSseEvent | MessageSseEvent;
			if (update.type === 'house') {
				const house = houses.find((h) => h.id === update.id);
				if (house) house.points = update.points;
			} else if (!messages.some((m) => m.id === update.id)) {
				messages = [...messages, update].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
			}
		};
		return () => source.close();
	});

	$effect(() => {
		const timer = setInterval(() => {
			bannerVisible = false;
			setTimeout(() => {
				const cutoff = Date.now() - EXPIRY_WINDOW_MS;
				messages = messages.filter((m) => new Date(m.createdAt).getTime() >= cutoff);
				if (messages.length === 0) {
					currentIndex = 0;
				} else {
					currentIndex = (currentIndex + 1) % messages.length;
				}
				setTimeout(() => {
					bannerVisible = true;
				}, BANNER_GAP_MS);
			}, BANNER_FADE_MS);
		}, ROTATION_INTERVAL_MS);
		return () => clearInterval(timer);
	});
</script>

<section class="page">
	<img class="background-image" src={backgroundImage} alt="" aria-hidden="true" />
	{#if !videoFailed}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			class="background-video"
			src={backgroundVideo}
			poster={backgroundImage}
			autoplay
			loop
			muted
			playsinline
			onerror={() => (videoFailed = true)}
		></video>
	{/if}
	<ul class="house-row">
		{#each houses as house (house.id)}
			<HouseOverviewCard name={house.name} crestSrc={crests[house.slug]} points={house.points} />
		{/each}
	</ul>
	<div class="messages">
		{#if currentMessage && bannerVisible}
			<RecentMessageBanner
				houseName={currentMessage.houseName}
				crestSrc={crests[currentMessage.houseSlug]}
				professorName={currentMessage.professorName}
				studentName={currentMessage.studentName}
				delta={currentMessage.delta}
				message={currentMessage.message}
				fadeMs={BANNER_FADE_MS}
			/>
		{/if}
	</div>
</section>

<style>
	.page {
		position: relative;
		min-height: 100vh;
		display: grid;
		grid-template:
			'houses' 2fr
			'messages' 1fr
			/ 100%;
		align-items: center;
		padding: var(--space-4);
		overflow: hidden;
	}

	.background-image,
	.background-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.background-image {
		z-index: -2;
	}

	.background-video {
		z-index: -1;
	}

	.house-row {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
	}

	.messages {
		grid-area: messages;
		justify-self: center;
	}
</style>
