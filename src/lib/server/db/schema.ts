import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const professors = pgTable('professors', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	active: boolean('active').notNull().default(true)
});

export const houses = pgTable('houses', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	points: integer('points').notNull().default(0)
});

export const pointTransactions = pgTable('point_transactions', {
	id: serial('id').primaryKey(),
	houseId: integer('house_id')
		.notNull()
		.references(() => houses.id),
	professorId: integer('professor_id')
		.notNull()
		.references(() => professors.id),
	delta: integer('delta').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;
export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
