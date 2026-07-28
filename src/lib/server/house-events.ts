import type { House } from './db/schema';

// In-process pub/sub only — fine for the current single-instance deployment.
// If this app ever runs multiple server instances, updates from one instance
// won't reach clients connected to another; would need a shared broker (e.g.
// Postgres LISTEN/NOTIFY) at that point.
const listeners = new Set<(house: House) => void>();

export function publishHouseUpdate(house: House): void {
	for (const listener of listeners) listener(house);
}

export function onHouseUpdate(callback: (house: House) => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}
