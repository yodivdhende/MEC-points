import { asc, eq } from 'drizzle-orm';
import { db } from './index';
import { students, houses, type Student, type House } from './schema';

export type StudentWithHouse = Student & { house: House };

export async function listStudents(): Promise<StudentWithHouse[]> {
	return db
		.select({
			id: students.id,
			name: students.name,
			houseId: students.houseId,
			house: houses
		})
		.from(students)
		.innerJoin(houses, eq(students.houseId, houses.id))
		.orderBy(asc(students.name));
}

export async function insertStudent(name: string, houseId: string): Promise<Student> {
	const [row] = await db.insert(students).values({ name, houseId }).returning();
	return row;
}

export async function deleteStudent(id: string): Promise<void> {
	await db.delete(students).where(eq(students.id, id));
}
