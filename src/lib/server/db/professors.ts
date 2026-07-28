import { eq } from 'drizzle-orm';
import { db } from './index';
import { professors, type Professor } from './schema';

export async function listActiveProfessors(): Promise<Professor[]> {
	return db.query.professors.findMany({
		where: eq(professors.active, true),
		orderBy: (p, { asc }) => [asc(p.name)]
	});
}

export async function listInactiveProfessors(): Promise<Professor[]> {
	return db.query.professors.findMany({
		where: eq(professors.active, false),
		orderBy: (p, { asc }) => [asc(p.name)]
	});
}

export async function getProfessorById(id: number): Promise<Professor | undefined> {
	return db.query.professors.findFirst({ where: eq(professors.id, id) });
}

export async function insertProfessor(name: string): Promise<Professor> {
	const [row] = await db.insert(professors).values({ name }).returning();
	return row;
}

export async function setProfessorActive(id: number, active: boolean): Promise<void> {
	await db.update(professors).set({ active }).where(eq(professors.id, id));
}
