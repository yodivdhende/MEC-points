import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { houses } from './schema.ts';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const HOUSES = [
	{ name: 'Alcertis', slug: 'alcertis' },
	{ name: 'Ibidens', slug: 'ibidens' },
	{ name: 'Lutridus', slug: 'lutridus' },
	{ name: 'Paventia', slug: 'paventia' },
	{ name: 'Luvium', slug: 'luvium' }
];

const inserted = await db
	.insert(houses)
	.values(HOUSES)
	.onConflictDoNothing({ target: houses.slug })
	.returning();

console.log(
	inserted.length > 0
		? `Seeded ${inserted.length} house(s): ${inserted.map((h) => h.name).join(', ')}`
		: 'Houses already present, nothing to seed.'
);

await client.end();
