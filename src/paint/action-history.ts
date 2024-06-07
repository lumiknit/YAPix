import { Action } from "./actions";

export class HistoryManager<A> {
	/** Maximum size of history. */
	maxHistory: number;

	/** History */
	history: A[][] = [];

	/** Futures, which are stacked by redo. */
	futures: A[][] = [];

	/** Action execution */
	onExec: (a: A) => void | A;
	/** Revert callback */
	onRevert: (a: A) => void;

	constructor(
		maxHistory: number,
		revert: (action: Action) => void | A,
		exec: (action: Action) => void,
	) {
		this.maxHistory = maxHistory;
		this.onRevert = revert;
		this.onExec = exec;
	}

	exec(actions: A[]) {
		const converted = [];
		for (const a of actions) {
			const r = this.onExec(a);
			converted.push(r || a);
		}
		this.history.push(converted);
		this.futures = [];
	}

	undo(): boolean {
		const actions = this.history.pop();
		if (!actions) return false;

		// Revert in reverse order
		for (let i = actions.length - 1; i >= 0; i--) {
			this.onRevert(actions[i]);
		}

		this.futures.push(actions);
		return true;
	}

	redo(): boolean {
		const actions = this.futures.pop();
		if (!actions) return false;

		const converted = [];
		for (const a of actions) {
			const r = this.onExec(a);
			converted.push(r || a);
		}

		this.history.push(converted);

		return true;
	}
}
