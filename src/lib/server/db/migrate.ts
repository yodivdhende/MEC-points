import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
await client.end();

console.log('Migrations applied.');
