import type { PageServerLoad } from './$types';
import { listHouses } from '$lib/server/db/houses';
import { getRecentMessages } from '$lib/server/message-feed';

export const load: PageServerLoad = async () => {
	const [houses, recentMessages] = await Promise.all([listHouses(), getRecentMessages()]);
	const messages = recentMessages.map((m) => ({
		id: m.id,
		houseSlug: m.houseSlug,
		houseName: m.houseName,
		professorName: m.professorName,
		studentName: m.studentName,
		delta: m.delta,
		message: m.message,
		createdAt: m.createdAt.toISOString()
	}));
	return { houses, messages };
};
