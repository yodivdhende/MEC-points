import { and, asc, eq, gte, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from './db';
import { pointTransactions, houses, professors, students } from './db/schema';

export type TransactionFeedItem = {
	id: string;
	houseId: string;
	houseName: string;
	houseSlug: string;
	professorId: string | null;
	professorName: string | null;
	studentId: string | null;
	studentName: string | null;
	message: string;
	delta: number;
	createdAt: Date;
};

const feedColumns = {
	id: pointTransactions.id,
	houseId: pointTransactions.houseId,
	houseName: houses.name,
	houseSlug: houses.slug,
	professorId: pointTransactions.professorId,
	professorName: professors.name,
	studentId: pointTransactions.studentId,
	studentName: students.name,
	message: pointTransactions.message,
	delta: pointTransactions.delta,
	createdAt: pointTransactions.createdAt
};

function feedQuery() {
	return db
		.select(feedColumns)
		.from(pointTransactions)
		.innerJoin(houses, eq(pointTransactions.houseId, houses.id))
		.leftJoin(professors, eq(pointTransactions.professorId, professors.id))
		.leftJoin(students, eq(pointTransactions.studentId, students.id));
}

// Messages from the past 2 hours, oldest first, for the main page's rotating feed.
export async function getRecentMessages(): Promise<TransactionFeedItem[]> {
	const rows = await feedQuery()
		.where(
			and(
				isNotNull(pointTransactions.message),
				ne(pointTransactions.message, ''),
				gte(pointTransactions.createdAt, sql`now() - interval '2 hours'`)
			)
		)
		.orderBy(asc(pointTransactions.createdAt));
	return rows as TransactionFeedItem[];
}

async function getFeedItemByTransactionId(id: string): Promise<TransactionFeedItem | undefined> {
	const [row] = await feedQuery().where(eq(pointTransactions.id, id));
	return row as TransactionFeedItem | undefined;
}

// In-process pub/sub only — fine for the current single-instance deployment.
// See src/routes/houses/CLAUDE.md for the single-instance caveat shared with
// the house-points SSE channel.
const listeners = new Set<(item: TransactionFeedItem) => void>();

function publishMessage(item: TransactionFeedItem): void {
	for (const listener of listeners) listener(item);
}

export function onMessage(callback: (item: TransactionFeedItem) => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

// Called by applyPointDelta after a transaction row is committed. No-ops
// unless a message was actually left, so the yearly reset (which always
// passes message: null) never surfaces here without any special-casing.
export async function notifyNewTransaction(
	transactionId: string,
	message: string | null
): Promise<void> {
	if (!message || message.trim().length === 0) return;
	const item = await getFeedItemByTransactionId(transactionId);
	if (item) publishMessage(item);
}
