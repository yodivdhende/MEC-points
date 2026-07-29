import { eq } from 'drizzle-orm';
import { db } from './index';
import { houses, pointTransactions, type House } from './schema';
import { clampPoints } from '$lib/util/points';
import { publishHouseUpdate } from '../house-events';

export async function listHouses(): Promise<House[]> {
	return db.query.houses.findMany({ orderBy: (h, { asc }) => [asc(h.name)] });
}

export async function applyPointDelta(
	houseId: string,
	professorId: string | null,
	delta: number,
	options: { studentId?: string | null; message?: string | null } = {}
): Promise<House> {
	const { studentId = null, message = null } = options;
	const updated = await db.transaction(async (tx) => {
		const house = await tx.query.houses.findFirst({ where: eq(houses.id, houseId) });
		if (!house) throw new Error('House not found');

		const [updated] = await tx
			.update(houses)
			.set({ points: clampPoints(house.points + delta) })
			.where(eq(houses.id, houseId))
			.returning();

		await tx.insert(pointTransactions).values({ houseId, professorId, studentId, message, delta });

		return updated;
	});

	publishHouseUpdate(updated);
	return updated;
}

// Zeroes every house's points as part of a yearly reset. professorId is null
// on these transaction rows since the trigger isn't tied to one professor;
// any future "points awarded per professor" query must filter those out.
export async function resetAllHousePoints(): Promise<House[]> {
	const all = await listHouses();
	const updated: House[] = [];
	for (const house of all) {
		if (house.points === 0) continue;
		updated.push(await applyPointDelta(house.id, null, -house.points));
	}
	return updated;
}
