import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProfessorById } from '$lib/server/db/professors';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) {
		error(404, 'Professor not found');
	}
	const professor = await getProfessorById(id);
	if (!professor) {
		error(404, 'Professor not found');
	}
	return { professor };
};
