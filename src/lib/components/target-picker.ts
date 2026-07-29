export type Target =
	| { type: 'house'; houseId: string; slug: string; label: string }
	| { type: 'student'; studentId: string; houseId: string; slug: string; label: string };
