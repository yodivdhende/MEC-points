import { deserialize } from '$app/forms';
import { clampPoints } from '$lib/util/points';

export type PointStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 5000;
const SAVED_LABEL_MS = 2000;

/**
 * Per-house point-adjustment state: optimistic display, debounced batching
 * of taps into a single `?/adjust` submission, and a synchronous flush for
 * page unload so pending taps aren't lost.
 */
export class HousePoints {
	readonly id: number;
	readonly name: string;
	readonly slug: string;

	baseline = $state(0);
	pendingDelta = $state(0);
	status = $state<PointStatus>('idle');

	#timer: ReturnType<typeof setTimeout> | null = null;

	constructor(house: { id: number; name: string; slug: string; points: number }) {
		this.id = house.id;
		this.name = house.name;
		this.slug = house.slug;
		this.baseline = house.points;
	}

	get displayed() {
		return clampPoints(this.baseline + this.pendingDelta);
	}

	bump(amount: 1 | -1) {
		this.pendingDelta += amount;
		this.status = 'idle';
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.flush(), DEBOUNCE_MS);
	}

	async flush() {
		this.#timer = null;
		if (this.pendingDelta === 0) return;

		const delta = this.pendingDelta;
		this.pendingDelta = 0;
		this.status = 'saving';

		try {
			const response = await fetch('?/adjust', {
				method: 'POST',
				body: this.#formData(delta),
				keepalive: true
			});
			const result = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				this.baseline = result.data.points as number;
				this.status = 'saved';
				setTimeout(() => {
					if (this.status === 'saved') this.status = 'idle';
				}, SAVED_LABEL_MS);
			} else {
				throw new Error('Save failed');
			}
		} catch {
			this.pendingDelta += delta;
			this.status = 'error';
		}
	}

	/** Fire-and-forget flush for beforeunload/pagehide, when awaiting a fetch isn't reliable. */
	flushOnUnload() {
		if (this.#timer) {
			clearTimeout(this.#timer);
			this.#timer = null;
		}
		if (this.pendingDelta === 0) return;
		navigator.sendBeacon('?/adjust', this.#formData(this.pendingDelta));
		this.pendingDelta = 0;
	}

	destroy() {
		if (this.#timer) clearTimeout(this.#timer);
	}

	#formData(delta: number) {
		const body = new FormData();
		body.set('houseId', String(this.id));
		body.set('delta', String(delta));
		return body;
	}
}
