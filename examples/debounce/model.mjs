// The truth the figure shows: a trailing debounce.
// Every press restarts a quiet timer. The output fires once, when the timer reaches `wait`
// with no press in between. A burst of presses closer together than `wait` fires exactly once.

export const WAITS = [0.25, 0.5, 1];

export function debouncer({ wait = 0.5 } = {}) {
  return { wait, quiet: Infinity, pending: false, presses: 0, fired: 0 };
}

export function press(state) {
  state.quiet = 0;
  state.pending = true;
  state.presses += 1;
}

/** Advance time. True on the step where the output fires. */
export function advance(state, dt) {
  state.quiet += dt;
  if (state.pending && state.quiet >= state.wait) {
    state.pending = false;
    state.fired += 1;
    return true;
  }
  return false;
}

/** How far the timer has run, 0..1; 1 when idle. */
export const progress = (state) => (state.pending ? Math.min(1, state.quiet / state.wait) : 1);
