import { onHouseUpdate } from '$lib/server/house-events';
import { onMessage } from '$lib/server/message-feed';
import type { RequestHandler } from './$types';

const HEARTBEAT_INTERVAL_MS = 25_000;

export const GET: RequestHandler = () => {
	const encoder = new TextEncoder();
	let unsubscribeHouse: () => void;
	let unsubscribeMessage: () => void;
	let heartbeat: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			unsubscribeHouse = onHouseUpdate((house) => {
				const payload = {
					type: 'house' as const,
					id: house.id,
					slug: house.slug,
					points: house.points
				};
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
			});

			unsubscribeMessage = onMessage((item) => {
				const payload = {
					type: 'message' as const,
					id: item.id,
					houseSlug: item.houseSlug,
					houseName: item.houseName,
					professorName: item.professorName,
					studentName: item.studentName,
					delta: item.delta,
					message: item.message,
					createdAt: item.createdAt.toISOString()
				};
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
			});

			heartbeat = setInterval(() => {
				controller.enqueue(encoder.encode(': ping\n\n'));
			}, HEARTBEAT_INTERVAL_MS);
		},
		cancel() {
			clearInterval(heartbeat);
			unsubscribeHouse();
			unsubscribeMessage();
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
