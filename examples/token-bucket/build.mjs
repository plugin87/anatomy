// Fig 1 · Token bucket. A coin tube on a bench is the bucket: a feeder drops one coin per 1/rate s,
// each request pushes the bottom coin out along a runway, and an empty tube rejects the request.
// node build.mjs  ->  token-bucket.html (follows the system theme), plus -dark and -light pinned copies.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso.mjs";
import { CAP, RATES } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// the page runs the same model the build imports, minus the constants it is given directly
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export const (CAP|RATES).*$/gm, "").replace(/^export /gm, "");
const WIDTH = 600;
const HEIGHT = 470;

// ----- world (units ~ px of the real object; x, y on the bench, z up) -----
const PLATE = { x: -78, y: -74, w: 148, d: 106, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const DISC_R = 13;
const DISC_H = 4;
const PITCH = 4.5;
const BOSS_R = 18;
const FLOOR = 6; // boss top, where the bottom coin sits
const POST_Y = 15.8;
const POST_R = 2;
const POST_TOP = 54;

const STROKE = 27; // pusher travel: the coin's centre goes from 0 to 27, clear of the stack
const STOP_DX = 45; // where the end stop catches the coin
const PUSH_LEN = 24;
const PUSH_W = 10;

const TUBE_R = 15;
const TUBE_BOTTOM = 78;
const TUBE_TOP = 136;
const GATE_Z = 75;
const GATE_OPEN = 34;

const FOOT = { x: -14, y: -66, w: 36, d: 26, r: 3 };
const FOOT_TOP = 10;
const COLUMN = { x: -6, y: -58, w: 12, d: 12, r: 2 };
const ARM_Z = 103;
const KNOB = [14, -53];
const KNOB_R = 4.5;
const KNOB_TOP = FOOT_TOP + 5;
const KNOB_FROM = Math.PI * 0.75;
const KNOB_SPAN = Math.PI * 1.5;

const P = k.fit(
  [...k.boxPoints(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, TUBE_TOP + 4], [TUBE_R, TUBE_R, TUBE_TOP], [-TUBE_R, -TUBE_R, TUBE_TOP]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 45, elevation: 30 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

function bench() {
  const out = [k.haloSvg(k.haloOf(k.insetPlan(PLATE, -2), -PLATE_H - FOOT_H, P), 10)];
  for (const [x, y] of k.byDepth(k.corners(PLATE, 18), P, ([x, y]) => [x, y, 0])) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slab(PLATE, -PLATE_H, PLATE_H, P, 8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9.5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { r: 0.5 }));
  // label plate with three rule lines that stand for printed text, and one engraved mark
  const label = { x: -66, y: 14, w: 34, d: 11, r: 1 };
  out.push(S(k.slab(label, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  for (const [y, len] of [[17.5, 20], [20, 14], [22.5, 17]]) out.push(L(k.onPlane([[label.x + 12, y], [label.x + 12 + len, y]], 0.7, P), { tone: "faint", free: true }));
  out.push(k.faceText(k.topMatrix([label.x + 5.5, label.y + 7.4], 0.7, P, "x"), `${CAP}`, { size: 5.5, tone: "mid" }));
  out.push(D([at([label.x + 2, label.y + 2, 0.7]), at([label.x + label.w - 2, label.y + label.d - 2, 0.7])], { r: 0.4 }));
  return out.join("");
}

function feederBack() {
  const out = [];
  out.push(S(k.slab(FOOT, 0, FOOT_TOP, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(FOOT, 2.5), FOOT_TOP, P), { tone: "faint" }));
  out.push(D(k.corners(FOOT, 3.2).map(([x, y]) => at([x, y, FOOT_TOP])), { r: 0.45 }));
  // rate dial: four detents on the foot top, knob with a knurl and a pointer
  const t = k.radialTicks(KNOB[0], KNOB[1], KNOB_R + 3.4, RATES.length - 1, 1, FOOT_TOP, [1.4, 1.4], P, KNOB_FROM, KNOB_SPAN);
  out.push(L(t.major, { tone: "mid" }));
  out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R, FOOT_TOP, KNOB_TOP - FOOT_TOP, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(KNOB[0], KNOB[1], KNOB_R, FOOT_TOP + 0.6, KNOB_TOP - 0.6, 22, P), { tone: "lo" }));
  out.push(L(k.ring(KNOB[0], KNOB[1], 1.2, KNOB_TOP, P, 14), { tone: "lo" }));
  out.push(`<path data-part="knob" class="ix-line" data-tone="hi" d="${knobPointer(1)}" style="stroke-width:1"/>`);
  // column with a seam band and the arm that carries the tube
  out.push(S(k.slab(COLUMN, FOOT_TOP, ARM_Z - FOOT_TOP, P, 3), { tone: "mid" }));
  for (const z of [30, 60, 88]) out.push(L(k.onPlane(k.roundedPlan(COLUMN, 3).filter(([x, y]) => x + y > COLUMN.x + COLUMN.y + 6), z, P), { tone: "faint" }));
  const arm = { x: -4, y: COLUMN.y - 2, w: 8, d: COLUMN.y * -1 - 14 + 2, r: 2 };
  out.push(S(k.slab(arm, ARM_Z, 6, P, 3), { tone: "mid" }));
  out.push(D([at([0, COLUMN.y + 4, ARM_Z + 6]), at([0, COLUMN.y + 20, ARM_Z + 6])], { r: 0.45 }));
  return out.join("");
}

function knobPointer(index) {
  const a = KNOB_FROM + (KNOB_SPAN * index) / (RATES.length - 1);
  return k.onPlane([[KNOB[0] + Math.cos(a) * 1.6, KNOB[1] + Math.sin(a) * 1.6], [KNOB[0] + Math.cos(a) * (KNOB_R - 0.6), KNOB[1] + Math.sin(a) * (KNOB_R - 0.6)]], KNOB_TOP, P);
}

function scale() {
  const bar = { x: -2, y: -31, w: 4, d: 6, r: 0.8 };
  const out = [S(k.slab(bar, 0, POST_TOP - 4, P, 3), { tone: "mid" })];
  const levels = Array.from({ length: CAP + 1 }, (_, i) => FLOOR + i * PITCH);
  const t = k.faceTicks(bar.x + bar.w, bar.y + bar.d - 0.6, levels, 4, [-1.6, -3.2], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([0, bar.y + 3, POST_TOP - 4])], { r: 0.45 }));
  return out.join("");
}

function post(y) {
  return [
    S(k.cylinder(0, y, POST_R + 1.2, FLOOR, 2, P, 24), { tone: "mid" }),
    S(k.cylinder(0, y, POST_R, FLOOR + 2, POST_TOP - FLOOR - 2, P, 24), { tone: "mid", crease: "none" }),
    S(k.cylinder(0, y, POST_R + 0.6, POST_TOP, 2, P, 24), { tone: "mid" }),
  ].join("");
}

function pusherTrack() {
  const out = [];
  const rail = { x: -66, y: -8, w: 50, d: 16, r: 1.5 };
  out.push(S(k.slab(rail, 0, FLOOR, P, 3), { tone: "mid" }));
  out.push(L(k.onPlane([[rail.x, -5.5], [rail.x + rail.w, -5.5]], FLOOR, P), { tone: "faint" }));
  out.push(L(k.onPlane([[rail.x, 5.5], [rail.x + rail.w, 5.5]], FLOOR, P), { tone: "faint" }));
  const stop = { x: -66, y: -9, w: 6, d: 18, r: 1.2 };
  out.push(S(k.slab(stop, FLOOR, 8, P, 3), { tone: "mid" }));
  out.push(D([at([-63, -5, FLOOR + 8]), at([-63, 5, FLOOR + 8])], { r: 0.45 }));
  return out.join("");
}

function pusher() {
  const body = { x: -DISC_R - 1 - PUSH_LEN, y: -PUSH_W / 2, w: PUSH_LEN, d: PUSH_W, r: 1 };
  const out = [S(k.slab(body, FLOOR, DISC_H, P, 3), { tone: "hi" })];
  out.push(L(k.planOutline(k.insetPlan(body, 1.6), FLOOR + DISC_H, P), { tone: "faint" }));
  const tab = [body.x + 5, 0];
  out.push(S(k.cylinder(tab[0], tab[1], 3, FLOOR + DISC_H, 3, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(tab[0], tab[1], 3, FLOOR + DISC_H + 0.4, FLOOR + DISC_H + 2.6, 14, P), { tone: "lo" }));
  return out.join("");
}

function boss() {
  const out = [k.haloSvg(k.haloOf({ x: -BOSS_R, y: -BOSS_R, w: BOSS_R * 2, d: BOSS_R * 2, r: BOSS_R }, 0, P), 5)];
  out.push(S(k.cylinder(0, 0, BOSS_R, 0, FLOOR, P, 48), { tone: "mid" }));
  out.push(L(k.ring(0, 0, BOSS_R - 2.4, FLOOR, P, 48), { tone: "faint" }));
  out.push(L(k.frontArc(0, 0, BOSS_R, 2.2, P, 32), { tone: "faint" }));
  return out.join("");
}

function runway() {
  const out = [];
  const way = { x: 14, y: -10, w: STOP_DX + DISC_R - 14, d: 20, r: 1.5 };
  out.push(S(k.slab(way, 0, FLOOR, P, 3), { tone: "mid" }));
  const t = k.ticks(20, way.x + way.w - 4, 3, 4, way.y + 0.8, FLOOR, [1.6, 3], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  return out.join("");
}

function endStop() {
  const stop = { x: STOP_DX + DISC_R, y: -10, w: 5, d: 20, r: 1.2 };
  return [S(k.slab(stop, 0, FLOOR + 6, P, 3), { tone: "mid" }), D([at([stop.x + 2.5, -6, FLOOR + 6]), at([stop.x + 2.5, 6, FLOOR + 6])], { r: 0.45 })].join("");
}

function coin() {
  const out = [S(k.cylinder(0, 0, DISC_R, 0, DISC_H, P, 56), { lit: true, crease: "lo" })];
  out.push(L(k.knurl(0, 0, DISC_R, 0.7, DISC_H - 0.7, 40, P), { tone: "lo" }));
  out.push(L(k.ring(0, 0, DISC_R - 2.4, DISC_H, P, 48), { tone: "lo" }));
  out.push(L(k.ring(0, 0, 2.2, DISC_H, P, 20), { tone: "mid" }));
  return out.join("");
}

function gate() {
  const plate = { x: -TUBE_R - 2, y: -TUBE_R - 2, w: (TUBE_R + 2) * 2, d: (TUBE_R + 2) * 2, r: 2 };
  return [S(k.slab(plate, GATE_Z, 3, P, 3), { tone: "mid" }), L(k.planOutline(k.insetPlan(plate, 2.4), GATE_Z + 3, P), { tone: "faint" })].join("");
}

function tube() {
  const out = [];
  // painted bottom to top: the tube below the clamp, the clamp band, then the tube above it
  const BAND = [ARM_Z - 1, ARM_Z + 7];
  out.push(S(k.cylinder(0, 0, TUBE_R, TUBE_BOTTOM, BAND[0] - TUBE_BOTTOM, P, 56), { tone: "mid", crease: "none" }));
  for (const z of [84, 92]) out.push(L(k.frontArc(0, 0, TUBE_R, z, P, 32), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, TUBE_R + 1.6, BAND[0], BAND[1] - BAND[0], P, 56), { tone: "mid" }));
  out.push(D([at([TUBE_R + 1.6, 0, ARM_Z + 3]), at([0, TUBE_R + 1.6, ARM_Z + 3])], { r: 0.55 }));
  out.push(S(k.cylinder(0, 0, TUBE_R, BAND[1], TUBE_TOP - BAND[1], P, 56), { tone: "mid", crease: "none" }));
  for (const z of [118, 126]) out.push(L(k.frontArc(0, 0, TUBE_R, z, P, 32), { tone: "faint" }));
  // knurled cap
  out.push(S(k.cylinder(0, 0, TUBE_R + 1, TUBE_TOP, 4, P, 56), { tone: "mid" }));
  out.push(L(k.knurl(0, 0, TUBE_R + 1, TUBE_TOP + 0.6, TUBE_TOP + 3.4, 48, P), { tone: "lo" }));
  out.push(L(k.ring(0, 0, TUBE_R - 3, TUBE_TOP + 4, P, 48), { tone: "faint" }));
  out.push(L(k.ring(0, 0, 3, TUBE_TOP + 4, P, 20), { tone: "lo" }));
  out.push(D([at([0, 0, TUBE_TOP + 4])], { r: 0.6 }));
  return out.join("");
}

// ----- assemble, back to front -----
const POOL = CAP + 3;
const coinArt = coin();
// The resting stack is in the markup, so the figure reads before (and without) the script.
const restingStack = Array.from({ length: CAP }, (_, i) => `<g data-coin transform="${k.translateAlong(P, [0, 0, FLOOR + i * PITCH])}">${coinArt}</g>`).join("");
const pool = Array.from({ length: POOL - CAP }, () => `<g data-coin style="display:none">${coinArt}</g>`).join("");

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: `A token bucket drawn as a coin dispenser. A tube on an arm drops one coin into a cradle every 1/rate seconds until ${CAP} coins are stacked. Each request slides a pusher that knocks the bottom coin out onto a runway. When the cradle is empty the pusher strokes through nothing and the request is rejected.`,
  body: [
    bench(),
    feederBack(),
    scale(),
    pusherTrack(),
    `<g data-part="pusher">${pusher()}</g>`,
    boss(),
    post(-POST_Y),
    runway(),
    `<g data-layer="eject"></g>`,
    `<g data-layer="stack">${restingStack}</g>`,
    post(POST_Y),
    endStop(),
    `<g data-layer="high"></g>`,
    `<g data-part="gate">${gate()}</g>`,
    tube(),
    `<g data-layer="pool" hidden>${pool}</g>`,
  ],
});

const card = k.cardHtml({
  fig: "Fig 1",
  title: "Token bucket",
  hint: "Click · Space: request   ↑↓: rate",
  readout: `tokens ${CAP}/${CAP} · refill 1/s`,
  keys: [
    { mark: "lit", label: "token (a coin)" },
    { mark: "mid", label: "limiter hardware" },
  ],
  caption: `The tube holds at most ${CAP} tokens. The feeder adds one every 1/rate seconds and drops it when the tube is full. Each request pushes out the bottom coin; with none left the request is rejected, which is a 429.`,
  body: svg,
});

const knobPaths = RATES.map((_, i) => knobPointer(i));
const live = `${k.runtimeSource(P)}
const CAP = ${CAP}, RATES = ${JSON.stringify(RATES)};
const DISC_H = ${DISC_H}, PITCH = ${PITCH}, FLOOR = ${FLOOR}, POST_TOP = ${POST_TOP}, STROKE = ${STROKE}, STOP_DX = ${STOP_DX};
const TUBE_BOTTOM = ${TUBE_BOTTOM}, GATE_OPEN = ${GATE_OPEN};
const KNOB = ${JSON.stringify(knobPaths)};
${MODEL}
const stage = document.querySelector(".ix-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const layer = (name) => svg.querySelector('[data-layer="' + name + '"]');
const ejectLayer = layer("eject"), stackLayer = layer("stack"), highLayer = layer("high"), poolLayer = layer("pool");
const pusherEl = svg.querySelector('[data-part="pusher"]');
const gateEl = svg.querySelector('[data-part="gate"]');
const knobEl = svg.querySelector('[data-part="knob"]');
const free = [...poolLayer.children];
const G = 1400;

let rateIndex = 1;
const state = bucket({ cap: CAP, rate: RATES[rateIndex], tokens: CAP });
const take = () => { const el = free.pop(); el.style.display = ""; el.style.opacity = ""; return el; };
const give = (el) => { el.style.display = "none"; poolLayer.appendChild(el); free.push(el); };
const stack = [...stackLayer.children].map((el, i) => ({ el, z: FLOOR + i * PITCH, v: 0 }));
const falling = [];
const ejects = [];
let last = "ready", queue = 0, gateOpen = 0, gateHold = 0;
const push = { x: 0, phase: "idle", t: 0, carrying: null };
let idle = 0, tourClock = 0, touring = !stillQuery.matches;

const ease = (t) => 1 - Math.pow(1 - t, 3);
const baseOf = () => (push.phase === "out" || push.phase === "hold") && push.carrying ? DISC_H : 0;

function setOrder(parent, els) {
  const kids = parent.children;
  let same = kids.length === els.length;
  for (let i = 0; same && i < els.length; i++) same = kids[i] === els[i];
  if (!same) for (const el of els) parent.appendChild(el);
}

function startStroke() {
  const ok = request(state);
  last = ok ? "accepted" : "rejected 429";
  push.phase = "out"; push.t = 0;
  push.carrying = ok ? stack.shift() : null;
  if (push.carrying) ejects.push({ el: push.carrying.el, dx: 0, v: 0, rest: 0 });
}

function tick(dt, still) {
  let busy = false;
  if (touring) {
    tourClock += dt;
    // a burst of 16 requests, 0.32 s apart, against 8 tokens and a 1/s refill: the last few are rejected
    const cycle = tourClock % 12;
    const want = cycle < 5.12 ? Math.floor(cycle / 0.32) + 1 : 0;
    if (want > (tick.sent || 0)) { queue += 1; tick.sent = want; }
    if (cycle >= 5.12) tick.sent = 0;
    busy = true;
  } else if ((idle += dt) > 5 && !stillQuery.matches) { touring = true; tourClock = 0; tick.sent = 0; }

  // refill: the model adds tokens; each one is a coin released through the gate
  const added = advance(state, dt);
  for (let i = 0; i < added; i++) { if (free.length) falling.push({ el: take(), z: TUBE_BOTTOM - DISC_H + 2, v: 0 }); gateHold = 0.22; }
  if (state.tokens < state.cap) busy = true;

  gateHold = Math.max(0, gateHold - dt);
  gateOpen = still ? (gateHold > 0 ? 1 : 0) : follow(gateOpen, gateHold > 0 ? 1 : 0, dt, 0.045);
  gateEl.setAttribute("transform", along([-GATE_OPEN * gateOpen, 0, 0]));
  if (Math.abs(gateOpen - (gateHold > 0 ? 1 : 0)) > 0.002) busy = true;

  // pusher: one stroke per request; it waits while the only coin is still falling
  if (push.phase === "idle" && queue > 0 && !(state.tokens >= 1 && stack.length === 0)) { queue -= 1; startStroke(); }
  if (push.phase !== "idle") {
    busy = true;
    push.t += still ? 1 : dt;
    if (push.phase === "out") {
      const k = Math.min(1, push.t / 0.12);
      push.x = STROKE * ease(k);
      const riding = ejects.find((c) => c.el === push.carrying?.el);
      if (riding) riding.dx = push.x;
      if (k >= 1) { push.phase = "hold"; push.t = 0; if (riding) riding.v = still ? 0 : 175; }
    } else if (push.phase === "hold") {
      if (push.t >= 0.04) { push.phase = "back"; push.t = 0; push.carrying = null; }
    } else {
      const k = Math.min(1, push.t / 0.14);
      push.x = STROKE * (1 - ease(k));
      if (k >= 1) { push.phase = "idle"; push.x = 0; }
    }
  }
  pusherEl.setAttribute("transform", along([push.x, 0, 0]));

  // each knocked-out coin slides to the end stop under friction, then is spent (fades)
  const decel = (175 * 175) / (2 * (STOP_DX - STROKE));
  for (let i = 0; i < ejects.length; i++) {
    const c = ejects[i];
    busy = true;
    if (push.phase !== "out" || c.el !== push.carrying?.el) {
      if (still) { c.dx = STOP_DX; c.v = 0; }
      if (c.v > 0) { c.v = Math.max(0, c.v - decel * dt); c.dx = Math.min(STOP_DX, c.dx + c.v * dt); if (c.dx === STOP_DX) c.v = 0; }
      if (c.v === 0 && c.dx > STROKE - 0.5) c.rest += still ? 1 : dt;
    }
    const alpha = Math.max(0, 1 - Math.max(0, c.rest - 0.04) / 0.2);
    c.el.style.opacity = alpha.toFixed(3);
    c.el.setAttribute("transform", along([c.dx, 0, FLOOR]));
    if (alpha <= 0) { give(c.el); ejects.splice(i, 1); i--; }
  }

  // the stack settles under gravity onto the boss, or onto the pusher while it is out
  const base = baseOf();
  stack.forEach((c, i) => {
    const target = FLOOR + base + i * PITCH;
    if (still || c.z <= target) { c.z = target; c.v = 0; } else { c.v += G * dt; c.z = Math.max(target, c.z - c.v * dt); busy = true; if (c.z === target) c.v = 0; }
    c.el.setAttribute("transform", along([0, 0, c.z]));
  });
  for (let i = 0; i < falling.length; i++) {
    const c = falling[i];
    const target = FLOOR + base + stack.length * PITCH;
    if (gateOpen < 0.6 && c.z > TUBE_BOTTOM - DISC_H - 1 && !still) { c.el.setAttribute("transform", along([0, 0, c.z])); busy = true; continue; }
    c.v += G * dt; c.z -= c.v * dt;
    if (still || c.z <= target) { c.z = target; c.v = 0; stack.push(c); falling.splice(i, 1); i--; }
    else busy = true;
    c.el.setAttribute("transform", along([0, 0, c.z]));
  }
  setOrder(stackLayer, [...stack.map((c) => c.el), ...falling.filter((c) => c.z + DISC_H <= POST_TOP + 2).map((c) => c.el)]);
  setOrder(highLayer, falling.filter((c) => c.z + DISC_H > POST_TOP + 2).map((c) => c.el));
  setOrder(ejectLayer, ejects.map((c) => c.el));

  const text = "tokens " + state.tokens + "/" + CAP + " · refill " + state.rate + "/s · " + last;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
  return busy || queue > 0;
}

const wake = loop(stage, tick);
const touch = () => { touring = false; idle = 0; };
const send = () => { touch(); queue = Math.min(queue + 1, 12); wake(); };
const setRate = (i) => { rateIndex = Math.max(0, Math.min(RATES.length - 1, i)); state.rate = RATES[rateIndex]; knobEl.setAttribute("d", KNOB[rateIndex]); wake(); };
stage.addEventListener("pointerdown", (e) => { e.preventDefault(); stage.focus({ preventScroll: true }); send(); });
stage.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); send(); }
  else if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); touch(); setRate(rateIndex + 1); }
  else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); touch(); setRate(rateIndex - 1); }
});
stillQuery.addEventListener("change", () => { touring = !stillQuery.matches; wake(); });
setRate(rateIndex);
wake();
`;

for (const [suffix, theme] of [["", "auto"], ["-dark", "dark"], ["-light", "light"]]) {
  const file = join(HERE, `token-bucket${suffix}.html`);
  writeFileSync(file, k.pageHtml({ title: "Token bucket", body: card, script: live, theme }));
  console.log("wrote", file);
}
