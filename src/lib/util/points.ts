export const MIN_POINTS = -99;
export const MAX_POINTS = 999;

export function clampPoints(value: number): number {
	return Math.min(MAX_POINTS, Math.max(MIN_POINTS, value));
}

export function formatPoints(points: number): string {
	if (points < 0) return '-' + Math.abs(points).toString().padStart(2, '0');
	return points.toString().padStart(3, '0');
}

export function formatSignedDelta(delta: number): string {
	return delta > 0 ? `+${delta}` : delta.toString();
}
