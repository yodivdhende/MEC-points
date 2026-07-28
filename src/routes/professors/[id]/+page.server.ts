import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProfessorById } from '$lib/server/db/professors';
import { listHouses, applyPointDelta } from '$lib/server/db/houses';
import { MIN_POINTS, MAX_POINTS } from '$lib/points';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) {
		error(404, 'Professor not found');
	}

	const [professor, houses] = await Promise.all([getProfessorById(id), listHouses()]);
	if (!professor) {
		error(404, 'Professor not found');
	}

	return { professor, houses };
};

export const actions: Actions = {
	adjust: async ({ request, params }) => {
		const professorId = Number(params.id);
		const form = await request.formData();
		const houseId = Number(form.get('houseId'));
		const delta = Number(form.get('delta'));

		if (!Number.isInteger(professorId)) {
			return fail(400, { action: 'adjust', error: 'Invalid professor.' });
		}
		if (!Number.isInteger(houseId)) {
			return fail(400, { action: 'adjust', error: 'Invalid house.' });
		}
		if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_POINTS - MIN_POINTS) {
			return fail(400, { action: 'adjust', error: 'Invalid delta.' });
		}

		const house = await applyPointDelta(houseId, professorId, delta);
		return { action: 'adjust', success: true, houseId: house.id, points: house.points };
	}
};
