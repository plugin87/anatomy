// The truth the figure shows: one cycle of a BTS train at a station, at model scale (1 unit = 0.3 m).
// A train cruises in at 60 u/s (65 km/h), brakes at 7 u/s² (2.1 m/s²) to stop at the platform, dwells
// with its doors open, then pulls away at 5 u/s² (1.5 m/s²). Both tracks run the same cycle, half a cycle apart.

export const UNIT_M = 0.3;
export const CRUISE = 60;
export const BRAKE = 7;
export const PULL = 5;
export const DWELL = 6;
export const AWAY = 4;

const BRAKE_T = CRUISE / BRAKE; // 8.57 s from cruise to stand
const PULL_T = CRUISE / PULL; // 12 s from stand to cruise
export const CYCLE = DWELL + PULL_T + AWAY + BRAKE_T;
const ARRIVE_AT = DWELL + PULL_T + AWAY; // when braking begins, far off to one side

/** Where a train is at cycle time t: x offset from its stop, speed (u/s), phase and door opening 0..1. */
export function trainAt(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < DWELL) {
    const open = smooth((t - 0.6) / 1) - smooth((t - (DWELL - 1.6)) / 1);
    return { x: 0, v: 0, phase: "dwell", doors: Math.max(0, open), left: DWELL - t };
  }
  if (t < DWELL + PULL_T) {
    const s = t - DWELL;
    return { x: 0.5 * PULL * s * s, v: PULL * s, phase: "departing", doors: 0 };
  }
  if (t < ARRIVE_AT) return { x: Infinity, v: CRUISE, phase: "away", doors: 0, left: ARRIVE_AT - t };
  const r = CYCLE - t; // time left until it stands at the platform
  return { x: -0.5 * BRAKE * r * r, v: BRAKE * r, phase: "arriving", doors: 0 };
}

export const kmh = (v) => v * UNIT_M * 3.6;

/** Cycle time at which the next train starts braking in, for "call a train". */
export const ARRIVAL_START = ARRIVE_AT;

function smooth(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}
