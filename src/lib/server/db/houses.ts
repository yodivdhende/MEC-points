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
	professorId: string,
	delta: number
): Promise<House> {
	const updated = await db.transaction(async (tx) => {
		const house = await tx.query.houses.findFirst({ where: eq(houses.id, houseId) });
		if (!house) throw new Error('House not found');

		const [updated] = await tx
			.update(houses)
			.set({ points: clampPoints(house.points + delta) })
			.where(eq(houses.id, houseId))
			.returning();

		await tx.insert(pointTransactions).values({ houseId, professorId, delta });

		return updated;
	});

	publishHouseUpdate(updated);
	return updated;
}
