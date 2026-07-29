import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const professors = pgTable('professors', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	active: boolean('active').notNull().default(true)
});

export const houses = pgTable('houses', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	points: integer('points').notNull().default(0)
});

export const students = pgTable('students', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	houseId: uuid('house_id')
		.notNull()
		.references(() => houses.id)
});

export const pointTransactions = pgTable('point_transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	houseId: uuid('house_id')
		.notNull()
		.references(() => houses.id),
	professorId: uuid('professor_id').references(() => professors.id),
	studentId: uuid('student_id').references(() => students.id),
	message: text('message'),
	delta: integer('delta').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
