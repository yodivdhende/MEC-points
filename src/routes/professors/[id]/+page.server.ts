import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProfessorById } from '$lib/server/db/professors';
import { listHouses, applyPointDelta } from '$lib/server/db/houses';
import { MIN_POINTS, MAX_POINTS } from '$lib/util/points';
import { isUuid } from '$lib/util/is-uuid';

export const load: PageServerLoad = async ({ params }) => {
	if (!isUuid(params.id)) {
		error(404, 'Professor not found');
	}

	const [professor, houses] = await Promise.all([getProfessorById(params.id), listHouses()]);
	if (!professor) {
		error(404, 'Professor not found');
	}

	return { professor, houses };
};

export const actions: Actions = {
	adjust: async ({ request, params }) => {
		const professorId = params.id;
		const form = await request.formData();
		const houseId = String(form.get('houseId') ?? '');
		const delta = Number(form.get('delta'));

		if (!isUuid(professorId)) {
			return fail(400, { action: 'adjust', error: 'Invalid professor.' });
		}
		if (!isUuid(houseId)) {
			return fail(400, { action: 'adjust', error: 'Invalid house.' });
		}
		if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_POINTS - MIN_POINTS) {
			return fail(400, { action: 'adjust', error: 'Invalid delta.' });
		}

		const house = await applyPointDelta(houseId, professorId, delta);
		return { action: 'adjust', success: true, houseId: house.id, points: house.points };
	}
};
