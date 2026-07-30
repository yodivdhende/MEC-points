import { db } from './index';
import { listHouses } from './houses';
import { clampPoints } from '$lib/util/points';

export type HousePointsSeries = {
	houseId: string;
	slug: string;
	name: string;
	points: { timestamp: Date; points: number }[];
};

// Reconstructs each house's point total over [since, now] by walking its
// transactions in the window forward from a baseline (current total minus
// the window's delta sum). This can drift slightly from the true historical
// value only if clamping (hitting -99/999) happened inside the window itself
// — acceptable at this app's scale, and much cheaper than replaying all
// history from zero.
export async function getHousePointsHistory(since: Date): Promise<HousePointsSeries[]> {
	const [allHouses, recentTransactions] = await Promise.all([
		listHouses(),
		db.query.pointTransactions.findMany({
			where: (t, { gte }) => gte(t.createdAt, since),
			orderBy: (t, { asc }) => [asc(t.createdAt)]
		})
	]);

	const now = new Date();

	return allHouses.map((house) => {
		const transactions = recentTransactions.filter((t) => t.houseId === house.id);
		const deltaSum = transactions.reduce((sum, t) => sum + t.delta, 0);
		const baseline = clampPoints(house.points - deltaSum);

		let running = baseline;
		const points = [{ timestamp: since, points: baseline }];
		for (const transaction of transactions) {
			running = clampPoints(running + transaction.delta);
			points.push({ timestamp: transaction.createdAt, points: running });
		}
		points.push({ timestamp: now, points: running });

		return { houseId: house.id, slug: house.slug, name: house.name, points };
	});
}
