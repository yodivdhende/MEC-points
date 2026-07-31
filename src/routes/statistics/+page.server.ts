import type { PageServerLoad } from './$types';
import { getHousePointsHistory, getProfessorPointActivity } from '$lib/server/db/statistics';

const WINDOW_DAYS = 4;

export const load: PageServerLoad = async () => {
	const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
	const [history, professorActivity] = await Promise.all([
		getHousePointsHistory(since),
		getProfessorPointActivity(since)
	]);

	const series = history.map((house) => ({
		houseId: house.houseId,
		slug: house.slug,
		name: house.name,
		points: house.points.map((p) => ({ ...p, timestamp: p.timestamp.toISOString() }))
	}));

	return { series, professorActivity };
};
