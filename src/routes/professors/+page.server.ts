import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listActiveProfessors,
	listInactiveProfessors,
	insertProfessor,
	setProfessorActive
} from '$lib/server/db/professors';
import { listStudents, insertStudent, deleteStudent } from '$lib/server/db/students';
import { listHouses, resetAllHousePoints } from '$lib/server/db/houses';
import { isUuid } from '$lib/util/is-uuid';

export const load: PageServerLoad = async () => {
	const [active, inactive, students, houses] = await Promise.all([
		listActiveProfessors(),
		listInactiveProfessors(),
		listStudents(),
		listHouses()
	]);
	return { active, inactive, students, houses };
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
		const id = String((await request.formData()).get('id') ?? '');
		if (!isUuid(id)) {
			return fail(400, { action: 'deactivate', error: 'Invalid professor.' });
		}
		await setProfessorActive(id, false);
		return { action: 'deactivate', success: true };
	},

	reactivate: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!isUuid(id)) {
			return fail(400, { action: 'reactivate', error: 'Invalid professor.' });
		}
		await setProfessorActive(id, true);
		return { action: 'reactivate', success: true };
	},

	resetAll: async () => {
		await resetAllHousePoints();
		return { action: 'resetAll', success: true };
	},

	addStudent: async ({ request }) => {
		const form = await request.formData();
		const name = (form.get('name') ?? '').toString().trim();
		const houseId = String(form.get('houseId') ?? '');
		if (!name) {
			return fail(400, { action: 'addStudent', error: 'Name is required.', name });
		}
		if (!isUuid(houseId)) {
			return fail(400, { action: 'addStudent', error: 'House is required.', name });
		}
		await insertStudent(name, houseId);
		return { action: 'addStudent', success: true };
	},

	removeStudent: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!isUuid(id)) {
			return fail(400, { action: 'removeStudent', error: 'Invalid student.' });
		}
		await deleteStudent(id);
		return { action: 'removeStudent', success: true };
	}
};
