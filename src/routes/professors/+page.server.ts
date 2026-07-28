import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listActiveProfessors,
	listInactiveProfessors,
	insertProfessor,
	setProfessorActive
} from '$lib/server/db/professors';

export const load: PageServerLoad = async () => {
	const [active, inactive] = await Promise.all([listActiveProfessors(), listInactiveProfessors()]);
	return { active, inactive };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const name = (form.get('name') ?? '').toString().trim();
		if (!name) {
			return fail(400, { action: 'add', error: 'Name is required.', name });
		}
		await insertProfessor(name);
		return { action: 'add', success: true };
	},

	deactivate: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) {
			return fail(400, { action: 'deactivate', error: 'Invalid professor.' });
		}
		await setProfessorActive(id, false);
		return { action: 'deactivate', success: true };
	},

	reactivate: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) {
			return fail(400, { action: 'reactivate', error: 'Invalid professor.' });
		}
		await setProfessorActive(id, true);
		return { action: 'reactivate', success: true };
	}
};
