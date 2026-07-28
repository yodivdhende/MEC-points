import { pgTable, serial, text, boolean } from 'drizzle-orm/pg-core';

export const professors = pgTable('professors', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	active: boolean('active').notNull().default(true)
});

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;
