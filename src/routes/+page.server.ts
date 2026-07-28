import type { PageServerLoad } from './$types';
import { listHouses } from '$lib/server/db/houses';

export const load: PageServerLoad = async () => {
	const houses = await listHouses();
	return { houses };
};
