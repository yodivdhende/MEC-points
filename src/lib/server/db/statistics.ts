import { asc, eq, gte } from 'drizzle-orm';
import { db } from './index';
import { pointTransactions, professors, students } from './schema';
import { listHouses } from './houses';
import { clampPoints } from '$lib/util/points';

export type HousePointsPoint = {
	timestamp: Date;
	points: number;
	delta: number | null;
	professorName: string | null;
	studentName: string | null;
	message: string | null;
};

export type HousePointsSeries = {
	houseId: string;
	slug: string;
	name: string;
	points: HousePointsPoint[];
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
		db
			.select({
				houseId: pointTransactions.houseId,
				createdAt: pointTransactions.createdAt,
				delta: pointTransactions.delta,
				message: pointTransactions.message,
				professorName: professors.name,
				studentName: students.name
			})
			.from(pointTransactions)
			.leftJoin(professors, eq(pointTransactions.professorId, professors.id))
			.leftJoin(students, eq(pointTransactions.studentId, students.id))
			.where(gte(pointTransactions.createdAt, since))
			.orderBy(asc(pointTransactions.createdAt))
	]);

	const now = new Date();

	return allHouses.map((house) => {
		const transactions = recentTransactions.filter((t) => t.houseId === house.id);
		const deltaSum = transactions.reduce((sum, t) => sum + t.delta, 0);
		const baseline = clampPoints(house.points - deltaSum);

		let running = baseline;
		const points: HousePointsPoint[] = [
			{
				timestamp: since,
				points: baseline,
				delta: null,
				professorName: null,
				studentName: null,
				message: null
			}
		];
		for (const transaction of transactions) {
			running = clampPoints(running + transaction.delta);
			points.push({
				timestamp: transaction.createdAt,
				points: running,
				delta: transaction.delta,
				professorName: transaction.professorName,
				studentName: transaction.studentName,
				message: transaction.message
			});
		}
		points.push({
			timestamp: now,
			points: running,
			delta: null,
			professorName: null,
			studentName: null,
			message: null
		});

		return { houseId: house.id, slug: house.slug, name: house.name, points };
	});
}
