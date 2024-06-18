import { Accessor, Setter, createSignal } from "solid-js";

type HistorySize = [number, number]; // [back, forward]

export class HistoryManager<A> {
	/** Maximum size of history. */
	maxHistory: number;

	/** History will be clean when it's size is over maxHistory + cleanThreshold. */
	cleanThreshold: number = 8;

	/** History */
	history: A[][] = [];

	/** Futures, which are stacked by redo. */
	futures: A[][] = [];

	/** History Size Signal, for UI */
	historySize: Accessor<HistorySize>;

	/** History Size signal setter */
	setHistorySize: Setter<HistorySize>;

	/** Action execution */
	onExec: (a: A) => void | A;
	/** Revert callback */
	onRevert: (a: A) => void;

	constructor(
		maxHistory: number,
		revert: (action: A) => void | A,
		exec: (action: A) => void,
	) {
		this.maxHistory = maxHistory;
		this.onRevert = revert;
		this.onExec = exec;

		[this.historySize, this.setHistorySize] = createSignal([0, 0]);
	}

	/**
	 * Just push an action. The invoker should already apply the action.
	 */
	push(actions: A[]) {
		this.history.push(actions);
		if (this.history.length > this.maxHistory + this.cleanThreshold) {
			this.history.splice(0, this.history.length - this.maxHistory);
		}
		this.futures = [];
		this.setHistorySize([this.history.length, 0]);
	}

	/**
	 * Execute the actions and push them to the history.
	 */
	exec(actions: A[]) {
		const converted = [];
		for (const a of actions) {
			const r = this.onExec(a);
			converted.push(r || a);
		}
		this.history.push(converted);
		this.futures = [];
		this.setHistorySize([this.history.length, 0]);
	}

	/**
	 * Undo the last action.
	 */
	undo(): boolean {
		const actions = this.history.pop();
		if (!actions) return false;

		// Revert in reverse order
		for (let i = actions.length - 1; i >= 0; i--) {
			this.onRevert(actions[i]);
		}

		this.futures.push(actions);

		this.setHistorySize([this.history.length, this.futures.length]);
		return true;
	}

	/**
	 * Redo the last action.
	 */
	redo(): boolean {
		const actions = this.futures.pop();
		if (!actions) return false;

		const converted = [];
		for (const a of actions) {
			const r = this.onExec(a);
			converted.push(r || a);
		}

		this.history.push(converted);

		this.setHistorySize([this.history.length, this.futures.length]);
		return true;
	}
}
