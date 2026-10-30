// The truth the figure shows: an integer token bucket.
// Capacity CAP tokens. One token is added every 1 / rate seconds while the bucket is below CAP
// (a full bucket drops the refill, as a real limiter does). A request takes one token or is rejected.

export const CAP = 8;
export const RATES = [0.5, 1, 2, 4];

export function bucket({ cap = CAP, rate = 1, tokens = cap } = {}) {
  return { cap, rate, tokens, clock: 0, accepted: 0, rejected: 0 };
}

/** Advance time. Returns how many tokens were added, so the feeder can drop that many discs. */
export function advance(state, dt) {
  if (state.tokens >= state.cap) {
    state.clock = 0;
    return 0;
  }
  state.clock += dt;
  let added = 0;
  const every = 1 / state.rate;
  while (state.clock >= every && state.tokens < state.cap) {
    state.clock -= every;
    state.tokens += 1;
    added += 1;
  }
  return added;
}

/** One request. True when a token was taken. */
export function request(state) {
  if (state.tokens >= 1) {
    state.tokens -= 1;
    state.accepted += 1;
    return true;
  }
  state.rejected += 1;
  return false;
}
