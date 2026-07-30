import { and, asc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import { db } from './index';
import { pointTransactions, professors, students } from './schema';
import { listHouses } from './houses';
import { listActiveProfessors } from './professors';
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

export type ProfessorPointActivity = {
	professorId: string;
	professorName: string;
	gifted: number; // sum of positive deltas in the window, >= 0
	subtracted: number; // sum of negative deltas in the window, <= 0
};

// One row per active professor, even those with no activity in the window —
// listActiveProfessors() drives membership, the aggregate query only fills in
// sums. professorId is nullable on point_transactions (yearly-reset rows have
// professorId = null), so isNotNull excludes those from the aggregate.
export async function getProfessorPointActivity(since: Date): Promise<ProfessorPointActivity[]> {
	const [activeProfessors, sums] = await Promise.all([
		listActiveProfessors(),
		db
			.select({
				professorId: pointTransactions.professorId,
				gifted: sql<number>`coalesce(sum(${pointTransactions.delta}) filter (where ${pointTransactions.delta} > 0), 0)`,
				subtracted: sql<number>`coalesce(sum(${pointTransactions.delta}) filter (where ${pointTransactions.delta} < 0), 0)`
			})
			.from(pointTransactions)
			.where(and(isNotNull(pointTransactions.professorId), gte(pointTransactions.createdAt, since)))
			.groupBy(pointTransactions.professorId)
	]);

	const byProfessor = new Map(sums.map((s) => [s.professorId as string, s]));

	return activeProfessors
		.map((prof) => {
			const sum = byProfessor.get(prof.id);
			return {
				professorId: prof.id,
				professorName: prof.name,
				gifted: Number(sum?.gifted ?? 0),
				subtracted: Number(sum?.subtracted ?? 0)
			};
		})
		.sort((a, b) => b.gifted - b.subtracted - (a.gifted - a.subtracted));
}
