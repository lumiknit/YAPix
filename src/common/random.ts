// Timestamp + random number
export const genID = (): string => {
	const ts = Date.now().toString(36);
	const rand = Math.random().toString(36).slice(2);
	return `${ts}-${rand}`;
};
