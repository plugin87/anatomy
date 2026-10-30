// Fig 2 · Debounce. A dashpot time-delay switch: each press shoves the cap down, oil lets it rise at a
// steady speed that takes exactly `wait`, and only a cap that reaches the top closes the switch.
// A burst of presses keeps resetting the rise, so it fires once. A ratchet counter steps one tooth per fire.
// node build.mjs  ->  debounce.html (follows the system theme), plus -dark and -light pinned copies.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso.mjs";
import { WAITS } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// the page runs the same model the build imports, minus the constants it is given directly
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export const WAITS.*$/m, "").replace(/^export /gm, "");
const WIDTH = 600;
const HEIGHT = 440;

// ----- world -----
const PLATE = { x: -54, y: -34, w: 120, d: 84, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const FLANGE_R = 22;
const FLANGE_H = 4;
const BODY_R = 16;
const BODY_TOP = 50;
const GLAND_R = 10;
const GLAND_TOP = 54;
const ROD_R = 2.5;
const SPRING_R = 5.4;
const STROKE = 24;
const CAP_R = 9;
const CAP_H = 6;
const CAP_UP = 82; // cap bottom when the timer has run out
const CONTACT = 87; // switch button bottom at rest; the cap top reaches 88 and lifts it 1 unit
const VALVE = [12.2, -5.5];
const VALVE_FROM = Math.PI * 0.9;
const VALVE_SPAN = Math.PI * 1.2;

const FOOT = { x: -44, y: -10, w: 20, d: 20, r: 3 };
const POST = { x: -38, y: -4, w: 8, d: 8, r: 1.5 };
const ARM_Z = 97;
const ARM = { x: -38, y: -4, w: 44, d: 8, r: 2 };
const SWITCH = { x: -6, y: -5, w: 12, d: 10, r: 1.5 };

const COUNTER = { x: 26, y: 12, w: 30, d: 28, r: 3 };
const COUNTER_H = 8;
const WHEEL = [41, 26];
const WHEEL_R = 10;
const WHEEL_TOP = COUNTER_H + 2.5;
const TEETH = 20;

const P = k.fit([...k.boxPoints(PLATE, -PLATE_H - FOOT_H, 0), [ARM.x, ARM.y, ARM_Z + 6], [ARM.x + ARM.w, 4, ARM_Z + 6]], WIDTH, HEIGHT, { pad: 26 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

function bench() {
  const out = [k.haloSvg(k.haloOf(k.insetPlan(PLATE, -2), -PLATE_H - FOOT_H, P), 10)];
  for (const [x, y] of k.byDepth(k.corners(PLATE, 16), P, ([x, y]) => [x, y, 0])) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slab(PLATE, -PLATE_H, PLATE_H, P, 8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9.5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { r: 0.5 }));
  const label = { x: -44, y: 34, w: 32, d: 9, r: 1 };
  out.push(S(k.slab(label, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  for (const [y, len] of [[36.6, 16], [38.6, 11], [40.6, 14]]) out.push(L(k.onPlane([[label.x + 13, y], [label.x + 13 + len, y]], 0.7, P), { tone: "faint", free: true }));
  out.push(k.faceText(k.topMatrix([label.x + 6.4, label.y + 6.2], 0.7, P, "x"), "DB", { size: 4.4, tone: "mid" }));
  return out.join("");
}

function stand() {
  const out = [S(k.slab(FOOT, 0, 6, P, 4), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(FOOT, 2.4), 6, P), { tone: "faint" }));
  out.push(D(k.corners(FOOT, 3).map(([x, y]) => at([x, y, 6])), { r: 0.45 }));
  out.push(S(k.slab(POST, 6, ARM_Z - 6, P, 3), { tone: "mid" }));
  for (const z of [32, 64]) out.push(L(k.onPlane(k.roundedPlan(POST, 3).filter(([x, y]) => x + y > POST.x + POST.y + 5), z, P), { tone: "faint" }));
  return out.join("");
}

function counter() {
  const out = [k.haloSvg(k.haloOf(COUNTER, 0, P), 4)];
  out.push(S(k.slab(COUNTER, 0, COUNTER_H, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(COUNTER, 2.4), COUNTER_H, P), { tone: "faint" }));
  out.push(D([at([COUNTER.x + 3, COUNTER.y + 3, COUNTER_H]), at([COUNTER.x + COUNTER.w - 3, COUNTER.y + COUNTER.d - 3, COUNTER_H]), at([COUNTER.x + 3, COUNTER.y + COUNTER.d - 3, COUNTER_H])], { r: 0.45 }));
  out.push(S(k.cylinder(WHEEL[0], WHEEL[1], WHEEL_R, COUNTER_H, WHEEL_TOP - COUNTER_H, P, 48), { tone: "mid" }));
  out.push(L(k.ring(WHEEL[0], WHEEL[1], WHEEL_R - 3.4, WHEEL_TOP, P, 40), { tone: "faint" }));
  out.push(`<path data-part="teeth" class="ix-line" data-tone="lo" d="${teethAt(0).minor}"/>`);
  out.push(`<path data-part="zero" class="ix-line" data-tone="hi" d="${teethAt(0).zero}" style="stroke-width:1"/>`);
  out.push(S(k.cylinder(WHEEL[0], WHEEL[1], 2, WHEEL_TOP, 1.2, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(COUNTER.x + 6, COUNTER.y + 6, 2.6, COUNTER_H, 1.6, P, 20), { tone: "mid" }));
  out.push(L(k.ring(COUNTER.x + 6, COUNTER.y + 6, 1.4, COUNTER_H + 1.6, P, 14), { tone: "lo" }));
  // pawl block that clicks the wheel round, and the fixed index mark it reads against
  const pawl = { x: WHEEL[0] + WHEEL_R + 0.6, y: WHEEL[1] - 2, w: 3.6, d: 4, r: 0.8 };
  out.push(S(k.slab(pawl, COUNTER_H, 3.6, P, 2), { tone: "mid" }));
  out.push(D([at([pawl.x + 1.8, pawl.y + 2, COUNTER_H + 3.6])], { r: 0.4 }));
  return out.join("");
}

function teethAt(angle) {
  const [cx, cy] = WHEEL;
  const minor = [];
  for (let i = 0; i < TEETH; i++) {
    const a = angle + (i / TEETH) * Math.PI * 2;
    minor.push(k.onPlane([[cx + Math.cos(a) * (WHEEL_R - 2.4), cy + Math.sin(a) * (WHEEL_R - 2.4)], [cx + Math.cos(a) * (WHEEL_R - 0.4), cy + Math.sin(a) * (WHEEL_R - 0.4)]], WHEEL_TOP, P));
  }
  const zero = k.onPlane([[cx + Math.cos(angle) * 3, cy + Math.sin(angle) * 3], [cx + Math.cos(angle) * (WHEEL_R - 0.4), cy + Math.sin(angle) * (WHEEL_R - 0.4)]], WHEEL_TOP, P);
  return { minor: minor.join(""), zero };
}

function dashpot() {
  const out = [k.haloSvg(k.haloOf({ x: -FLANGE_R, y: -FLANGE_R, w: FLANGE_R * 2, d: FLANGE_R * 2, r: FLANGE_R }, 0, P), 5)];
  out.push(S(k.cylinder(0, 0, FLANGE_R, 0, FLANGE_H, P, 56), { tone: "mid" }));
  const bolts = k.byDepth([0, 1, 2, 3].map((i) => [Math.cos(Math.PI / 4 + (i * Math.PI) / 2) * 19, Math.sin(Math.PI / 4 + (i * Math.PI) / 2) * 19]), P, ([x, y]) => [x, y, FLANGE_H]);
  for (const [x, y] of bolts) {
    out.push(S(k.cylinder(x, y, 1.6, FLANGE_H, 1, P, 12), { tone: "mid", crease: "none" }));
    out.push(D([at([x, y, FLANGE_H + 1])], { r: 0.4 }));
  }
  // body painted bottom to top in segments, with two straps between them
  const straps = [[10, 12], [40, 42]];
  let from = FLANGE_H;
  for (const [z0, z1] of straps) {
    out.push(S(k.cylinder(0, 0, BODY_R, from, z0 - from, P, 56), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(0, 0, BODY_R + 0.8, z0, z1 - z0, P, 56), { tone: "mid" }));
    from = z1;
  }
  out.push(S(k.cylinder(0, 0, BODY_R, from, BODY_TOP - from, P, 56), { tone: "mid", crease: "none" }));
  for (const z of [20, 30]) out.push(L(k.frontArc(0, 0, BODY_R, z, P, 32), { tone: "faint" }));
  out.push(L(k.ring(0, 0, BODY_R - 2, BODY_TOP, P, 48), { tone: "faint" }));
  // needle valve that sets the delay: knurled knob with a pointer over three detents
  const t = k.radialTicks(VALVE[0], VALVE[1], 3.9, WAITS.length - 1, 1, BODY_TOP, [1.1, 1.1], P, VALVE_FROM, VALVE_SPAN);
  out.push(L(t.major, { tone: "mid" }));
  out.push(S(k.cylinder(-11.5, 6.5, 1.8, BODY_TOP, 1.4, P, 16), { tone: "mid" }));
  out.push(D([at([-11.5, 6.5, BODY_TOP + 1.4])], { r: 0.4 }));
  out.push(S(k.cylinder(VALVE[0], VALVE[1], 2.9, BODY_TOP, 0.9, P, 6), { tone: "lo" }));
  out.push(S(k.cylinder(VALVE[0], VALVE[1], 2.3, BODY_TOP + 0.9, 2.1, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(VALVE[0], VALVE[1], 2.3, BODY_TOP + 1.3, BODY_TOP + 2.6, 12, P), { tone: "lo" }));
  out.push(`<path data-part="valve" class="ix-line" data-tone="hi" d="${valvePointer(1)}"/>`);
  out.push(S(k.cylinder(0, 0, GLAND_R, BODY_TOP, GLAND_TOP - BODY_TOP, P, 40), { tone: "mid" }));
  out.push(L(k.ring(0, 0, ROD_R + 1.2, GLAND_TOP, P, 24), { tone: "lo" }));
  return out.join("");
}

function valvePointer(index) {
  const a = VALVE_FROM + (VALVE_SPAN * index) / (WAITS.length - 1);
  return k.onPlane([[VALVE[0], VALVE[1]], [VALVE[0] + Math.cos(a) * 2, VALVE[1] + Math.sin(a) * 2]], BODY_TOP + 3, P);
}

// moving parts are built at the top of their travel and moved down by the live script
function rod() {
  const bottom = GLAND_TOP - STROKE - 2;
  return [
    S(k.cylinder(0, 0, ROD_R, bottom, CAP_UP - bottom, P, 20), { tone: "hi", crease: "none" }),
  ].join("");
}

function cap() {
  const out = [S(k.cylinder(0, 0, ROD_R + 1.4, CAP_UP - 1.8, 1.8, P, 6), { tone: "mid" })];
  out.push(S(k.cylinder(0, 0, CAP_R, CAP_UP, CAP_H, P, 48), { lit: true, crease: "lo" }));
  out.push(L(k.knurl(0, 0, CAP_R, CAP_UP + 0.8, CAP_UP + CAP_H - 1.6, 30, P), { tone: "lo" }));
  out.push(L(k.ring(0, 0, CAP_R - 2, CAP_UP + CAP_H, P, 40), { tone: "lo" }));
  out.push(D([at([0, 0, CAP_UP + CAP_H])], { r: 0.6, tone: "hi" }));
  return out.join("");
}

function switchBody() {
  const out = [];
  out.push(`<g data-part="button">${S(k.cylinder(0, 0, 1.6, CONTACT, 89 - CONTACT, P, 16), { tone: "hi" })}</g>`);
  out.push(S(k.slab(SWITCH, 89, ARM_Z - 89, P, 3), { tone: "mid" }));
  out.push(L(k.onPlane(k.roundedPlan(SWITCH, 3).filter(([x, y]) => x + y > SWITCH.x + SWITCH.y + 6), 93, P), { tone: "faint" }));
  out.push(S(k.slab(k.insetPlan(POST, -1.4), ARM_Z - 5, 5, P, 3), { tone: "mid" }));
  out.push(D([at([POST.x + POST.w + 1.4, 0, ARM_Z - 2.5])], { r: 0.45 }));
  out.push(S(k.slab(ARM, ARM_Z, 6, P, 3), { tone: "mid" }));
  out.push(D([at([-34, 0, ARM_Z + 6]), at([-20, 0, ARM_Z + 6]), at([0, 0, ARM_Z + 6])], { r: 0.45 }));
  return out.join("");
}

function wire() {
  const route = [
    [-1, 5.4, 92],
    [-29, 5.4, 92],
    [-29, 5.4, 6.4],
    [-29, 10.4, 6.4],
    [-29, 10.4, 0.4],
    [-29, 30, 0.4],
    // turn toward the front before x = 14: further along, a run at y = 30 would sit behind the counter
    [14, 30, 0.4],
    [14, 43, 0.4],
    [30, 43, 0.4],
    [30, COUNTER.y + COUNTER.d + 2.6, 3.9],
  ];
  const out = [k.wireSvg(route.map(at), { tone: "mid" })];
  // cable clips over the run on the bench: drawn after the wire, so the wire passes under them
  for (const clip of [{ x: -31.5, y: 19, w: 5, d: 3, r: 0.8 }, { x: -2, y: 27.5, w: 3, d: 5, r: 0.8 }]) {
    out.push(S(k.slab(clip, 0, 1.4, P, 2), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

function terminal() {
  // connector shell on the counter's front face (+y, which faces the viewer) where the wire lands
  const shell = { x: 27.4, y: COUNTER.y + COUNTER.d, w: 5.2, d: 2.2, r: 0.6 };
  return S(k.slab(shell, 1.6, 4.6, P, 2), { tone: "mid" });
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A debounce drawn as a dashpot time-delay switch. Each press pushes a cap down on a rod; oil lets it rise at a steady speed that takes exactly the wait time to reach a switch on an arm above. A press before it arrives pushes it down again, so a burst of presses closes the switch once, and a ratchet counter on the bench steps one tooth per firing.",
  body: [
    `<defs><clipPath id="ix-gland"><path d="${k.clipAbove(0, 0, ROD_R + 0.4, GLAND_TOP, P)}"/></clipPath></defs>`,
    bench(),
    stand(),
    counter(),
    dashpot(),
    `<path data-part="spring-back" class="ix-line" data-tone="mid" style="stroke-width:.8"/>`,
    `<g clip-path="url(#ix-gland)"><g data-part="rod">${rod()}</g></g>`,
    `<path data-part="spring-front" class="ix-line" data-tone="hi" style="stroke-width:.8"/>`,
    `<g data-part="cap">${cap()}</g>`,
    switchBody(),
    terminal(),
    wire(),
  ],
});

const card = k.cardHtml({
  fig: "Fig 2",
  title: "Debounce",
  hint: "Click · Space: press   ↑↓: delay",
  readout: "fired 0 · presses 0 · ready",
  keys: [
    { mark: "lit", label: "timer cap" },
    { mark: "mid", label: "dashpot, switch and counter" },
  ],
  caption:
    "Each press pushes the cap down and restarts the wait. Oil lets it rise at a steady speed that takes exactly the wait to reach the switch, so only a quiet spell that long closes it. A burst of presses fires once.",
  body: svg,
});

const live = `${k.runtimeSource(P)}
const WAITS = ${JSON.stringify(WAITS)};
const STROKE = ${STROKE}, CAP_UP = ${CAP_UP}, CAP_H = ${CAP_H}, CONTACT = ${CONTACT}, GLAND_TOP = ${GLAND_TOP}, SPRING_R = ${SPRING_R};
const WHEEL = ${JSON.stringify(WHEEL)}, WHEEL_R = ${WHEEL_R}, WHEEL_TOP = ${WHEEL_TOP}, TEETH = ${TEETH};
const VALVE = ${JSON.stringify(WAITS.map((_, i) => valvePointer(i)))};
${MODEL}
const stage = document.querySelector(".ix-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const rodEl = part("rod"), capEl = part("cap"), buttonEl = part("button"), backEl = part("spring-back"), frontEl = part("spring-front");
const teethEl = part("teeth"), zeroEl = part("zero"), valveEl = part("valve");

let waitIndex = 1;
const state = debouncer({ wait: WAITS[waitIndex] });
let cap = 1; // drawn cap height, 0 = pushed down, 1 = at the switch
let wheel = 0, wheelTarget = 0, flash = "ready";
let idle = 0, tourClock = 0, touring = !stillQuery.matches, sent = 0;
const DOWN_SPEED = 1 / 0.07; // a press drives the cap down in 70 ms

// the tour: a bouncy burst of 6 presses, a quiet spell that fires once, then one clean press that fires again
const TOUR = [0, 0.18, 0.31, 0.52, 0.66, 0.9, 2.6];
const TOUR_LEN = 4.4;

const [vx, vy] = [Math.cos(P.azimuth * RAD), Math.sin(P.azimuth * RAD)];
function spring(top) {
  // a helix from the gland to the underside of the cap; the half facing the viewer is drawn over the rod
  const turns = 7, per = 18, n = turns * per;
  const back = [], front = [];
  let run = [], side = null;
  const flush = () => { if (run.length > 1) (side ? front : back).push("M" + run.join("L")); };
  for (let i = 0; i <= n; i++) {
    const a = (i / per) * Math.PI * 2;
    const x = Math.cos(a) * SPRING_R, y = Math.sin(a) * SPRING_R;
    const [sx, sy] = iso([x, y, GLAND_TOP + (top - GLAND_TOP) * (i / n)]);
    const isFront = x * vx + y * vy > 0;
    if (side !== null && isFront !== side) { flush(); run = [run[run.length - 1]]; }
    side = isFront;
    run.push(sx.toFixed(2) + " " + sy.toFixed(2));
  }
  flush();
  return { back: back.join(""), front: front.join("") };
}

function teeth(angle) {
  let d = "";
  for (let i = 0; i < TEETH; i++) {
    const a = angle + (i / TEETH) * Math.PI * 2;
    d += onPlane([[WHEEL[0] + Math.cos(a) * (WHEEL_R - 2.4), WHEEL[1] + Math.sin(a) * (WHEEL_R - 2.4)], [WHEEL[0] + Math.cos(a) * (WHEEL_R - 0.4), WHEEL[1] + Math.sin(a) * (WHEEL_R - 0.4)]], WHEEL_TOP);
  }
  return d;
}

function draw() {
  const drop = (1 - cap) * STROKE;
  rodEl.setAttribute("transform", along([0, 0, -drop]));
  capEl.setAttribute("transform", along([0, 0, -drop]));
  const lift = Math.max(0, CAP_UP + CAP_H - drop - CONTACT);
  buttonEl.setAttribute("transform", along([0, 0, lift]));
  const s = spring(CAP_UP - drop);
  backEl.setAttribute("d", s.back);
  frontEl.setAttribute("d", s.front);
  teethEl.setAttribute("d", teeth(wheel));
  zeroEl.setAttribute("d", onPlane([[WHEEL[0] + Math.cos(wheel) * 3, WHEEL[1] + Math.sin(wheel) * 3], [WHEEL[0] + Math.cos(wheel) * (WHEEL_R - 0.4), WHEEL[1] + Math.sin(wheel) * (WHEEL_R - 0.4)]], WHEEL_TOP));
  const quiet = state.pending ? "quiet " + Math.round(Math.min(state.quiet, state.wait) * 1000) + "/" + Math.round(state.wait * 1000) + " ms" : flash;
  const text = "fired " + state.fired + " · presses " + state.presses + " · " + quiet;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}

function tick(dt, still) {
  let busy = false;
  if (touring) {
    busy = true;
    tourClock += dt;
    const t = tourClock % TOUR_LEN;
    if (t < TOUR[0] + dt * 1.5 && sent === TOUR.length) sent = 0;
    while (sent < TOUR.length && t >= TOUR[sent]) { press(state); sent += 1; }
  } else if ((idle += dt) > 5 && !stillQuery.matches) { touring = true; tourClock = 0; sent = 0; }

  if (advance(state, dt)) { wheelTarget -= (Math.PI * 2) / TEETH; flash = "fired"; }
  if (state.pending) busy = true;

  // the cap is driven down fast by a press, then rises with the timer: its height is the timer
  const want = progress(state);
  cap = still ? want : want < cap ? Math.max(want, cap - DOWN_SPEED * dt) : want;
  if (cap !== want) busy = true;
  wheel = still ? wheelTarget : follow(wheel, wheelTarget, dt, 0.08);
  if (Math.abs(wheel - wheelTarget) > 1e-4) busy = true; else wheel = wheelTarget;
  draw();
  return busy;
}

const wake = loop(stage, tick);
const touch = () => { touring = false; idle = 0; };
const hit = () => { touch(); press(state); wake(); };
const setWait = (i) => { waitIndex = Math.max(0, Math.min(WAITS.length - 1, i)); state.wait = WAITS[waitIndex]; valveEl.setAttribute("d", VALVE[waitIndex]); draw(); wake(); };
stage.addEventListener("pointerdown", (e) => { e.preventDefault(); stage.focus({ preventScroll: true }); hit(); });
stage.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); hit(); }
  else if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); touch(); setWait(waitIndex + 1); }
  else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); touch(); setWait(waitIndex - 1); }
});
stillQuery.addEventListener("change", () => { touring = !stillQuery.matches; wake(); });
draw();
wake();
`;

// the spring is drawn at rest in the markup too, so the figure reads without the script
const restSpring = (() => {
  const turns = 7, per = 18, n = turns * per;
  const [vx, vy] = k.toViewer(P);
  const back = [];
  const front = [];
  let run = [];
  let side = null;
  for (let i = 0; i <= n; i++) {
    const a = (i / per) * Math.PI * 2;
    const x = Math.cos(a) * SPRING_R;
    const y = Math.sin(a) * SPRING_R;
    const p = at([x, y, GLAND_TOP + (CAP_UP - GLAND_TOP) * (i / n)]);
    const isFront = x * vx + y * vy > 0;
    if (side !== null && isFront !== side) {
      (side ? front : back).push(k.pathOf(run));
      run = [run[run.length - 1]];
    }
    side = isFront;
    run.push(p);
  }
  (side ? front : back).push(k.pathOf(run));
  return { back: back.join(""), front: front.join("") };
})();
const page = (theme) =>
  k.pageHtml({
    title: "Debounce",
    body: card.replace('data-part="spring-back" class="ix-line"', `data-part="spring-back" d="${restSpring.back}" class="ix-line"`).replace('data-part="spring-front" class="ix-line"', `data-part="spring-front" d="${restSpring.front}" class="ix-line"`),
    script: live,
    theme,
  });

for (const [suffix, theme] of [["", "auto"], ["-dark", "dark"], ["-light", "light"]]) {
  const file = join(HERE, `debounce${suffix}.html`);
  writeFileSync(file, page(theme));
  console.log("wrote", file);
}
