import { onHouseUpdate } from '$lib/server/house-events';
import type { RequestHandler } from './$types';

const HEARTBEAT_INTERVAL_MS = 25_000;

export const GET: RequestHandler = () => {
	const encoder = new TextEncoder();
	let unsubscribe: () => void;
	let heartbeat: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			unsubscribe = onHouseUpdate((house) => {
				const payload = { id: house.id, slug: house.slug, points: house.points };
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
			});

			heartbeat = setInterval(() => {
				controller.enqueue(encoder.encode(': ping\n\n'));
			}, HEARTBEAT_INTERVAL_MS);
		},
		cancel() {
			clearInterval(heartbeat);
			unsubscribe();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			connection: 'keep-alive'
		}
	});
};
