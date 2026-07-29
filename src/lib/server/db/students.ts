import { eq } from 'drizzle-orm';
import { db } from './index';
import { students, type Student } from './schema';

export async function listStudents(): Promise<Student[]> {
	return db.query.students.findMany({ orderBy: (s, { asc }) => [asc(s.name)] });
}

export async function insertStudent(name: string): Promise<Student> {
	const [row] = await db.insert(students).values({ name }).returning();
	return row;
}

export async function deleteStudent(id: string): Promise<void> {
	await db.delete(students).where(eq(students.id, id));
}
