export const MIN_POINTS = -99;
export const MAX_POINTS = 999;

export function clampPoints(value: number): number {
	return Math.min(MAX_POINTS, Math.max(MIN_POINTS, value));
}
