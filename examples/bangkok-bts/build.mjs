// Fig 3 · Bangkok street. A 1:300 architectural model on a plinth: a BTS Skytrain station over four lanes,
// a row of four-storey shophouses behind, the pole-and-cable tangle, hawker carts, a bus, a taxi and a tuk-tuk.
// Two trains run the station cycle from model.mjs half a cycle apart. 1 unit = 0.3 m.
// node build.mjs  ->  bangkok-bts.html (follows the system theme), plus -dark and -light pinned copies.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const WIDTH = 680;
const HEIGHT = 470;

// ----- world -----
const PLINTH = { x: -134, y: -74, w: 268, d: 114, r: 5 };
const X0 = -130;
const X1 = 130;
const FRONT = -36; // shophouse fronts
const WALK_B = [-36, -28]; // back sidewalk
const ROAD = [-28, 20];
const WALK_F = [20, 32];
const CURB = 1.2;

const PIERS = [-105, -35, 35, 105];
const DECK = { y0: -18, y1: 10, z0: 36, z1: 40 };
const NEAR_TRACK = 4;
const FAR_TRACK = -10;
const CAR_L = 44;
const CAR_GAP = 2;
const CARS = 3;
const TRAIN_L = CARS * CAR_L + (CARS - 1) * CAR_GAP;
const STOP_X = -70; // west end of a standing train
const CAR_DOORS = [8, 22, 36];
const DOOR_W = 5;
const ST = { x0: -72, x1: 68 }; // station extent
const PLAT_N = { y0: 10, y1: 20 };
const PLAT_F = { y0: -29, y1: -18 };
const PLAT_Z = [30, 40];
const ROOF_Z = 64;
const PORTALS = [-56, 0, 52];

const P = k.fit([...k.boxPoints(PLINTH, -12, 0), [X0, -66, 62], [X1, -66, 62], [X0, -30, ROOF_Z + 4], [ST.x1, 22, ROOF_Z + 4]], WIDTH, HEIGHT, { pad: 18, azimuth: 50, elevation: 42 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const slab = (plan, z, h, style = {}, steps = 3) => S(k.slab(plan, z, h, P, steps), { tone: "mid", ...style });
const cyl = (x, y, r, z, h, style = {}, steps = 20) => S(k.cylinder(x, y, r, z, h, P, steps), { tone: "mid", ...style });
const faceY = (pts, y, style, closed = false) => L(k.onFaceY(pts, y, P, closed), style);
const darkRect = (x0, x1, z0, z1, y) => `<path class="ix-shade" data-s="0" d="${k.rectOnFaceY(x0, x1, z0, z1, y, P)}"/>`;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----- plinth -----
function plinth() {
  const out = [k.haloSvg(k.haloOf(k.insetPlan(PLINTH, -3), -12, P), 12)];
  out.push(slab(k.insetPlan(PLINTH, 2.5), -12, 2, { tone: "lo" }, 6));
  out.push(slab(PLINTH, -10, 10, {}, 6));
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 2.6), 0, P), { tone: "faint" }));
  const screws = k.corners(PLINTH, 5.5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.6, 0, P, 14)).join(""), { tone: "lo" }), D(screws.map(([x, y]) => at([x, y, 0])), { r: 0.45 }));
  // scale bar: 10 m at 1 unit = 0.3 m, a tick every metre, majors at 0, 5 and 10
  const bar = { x: -124, y: 34.4, w: 36.6, d: 2.6, r: 0.5 };
  out.push(slab(bar, 0, 0.5, { tone: "lo", crease: "none" }, 2));
  const t = k.ticks(-122, -122 + 33.34, 10 / 3, 5, 34.6, 0.5, [1, 1.9], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const label = { x: 98, y: 33.4, w: 30, d: 5, r: 0.8 };
  out.push(slab(label, 0, 0.6, { tone: "lo", crease: "none" }, 2));
  out.push(k.faceText(k.topMatrix([label.x + 5.4, label.y + 3.4], 0.6, P, "x"), "BTS", { size: 2.6, tone: "mid" }));
  for (const [y, len] of [[34.8, 15], [36.4, 10]]) out.push(L(k.onPlane([[label.x + 11, y], [label.x + 11 + len, y]], 0.6, P), { tone: "faint", free: true }));
  return out.join("");
}

// ----- shophouses -----
const FANS = [];
const SHUTTERS = [];

function shophouse(i) {
  const r = rng(i * 7919 + 13);
  const x0 = X0 + 4 + i * 14;
  const x1 = x0 + 14;
  const floors = r() < 0.18 ? 5 : r() < 0.15 ? 3 : 4;
  const H = floors * 12;
  const y = FRONT;
  const out = [slab({ x: x0, y: -66, w: 14, d: 30, r: 0 }, 0, H, {}, 1)];
  // ground floor shop: a dark recess with shelves, or a roll-down shutter over it
  const shop = [x0 + 1.4, x1 - 1.4, CURB, 10];
  out.push(darkRect(shop[0], shop[1], shop[2], shop[3], y + 0.02));
  for (const z of [4.4, 7.2]) out.push(faceY([[shop[0], z], [shop[1], z]], y + 0.03, { tone: "faint" }));
  const animated = i === 4 || i === 11;
  const closed = !animated && r() < 0.3;
  if (animated) {
    SHUTTERS.push({ x0: shop[0], x1: shop[1], z0: shop[2], z1: shop[3], y: y + 0.05, phase: i === 4 ? 0 : 0.5 });
    out.push(`<g data-shutter="${SHUTTERS.length - 1}"><path class="ix-top" d=""/><path class="ix-line" data-tone="lo" d=""/></g>`);
  } else if (closed) {
    out.push(`<path class="ix-top" d="${k.rectOnFaceY(shop[0], shop[1], shop[2], shop[3], y + 0.05, P)}"/>`);
    const ribs = [];
    for (let z = shop[3] - 0.9; z > shop[2]; z -= 0.9) ribs.push(k.onFaceY([[shop[0], z], [shop[1], z]], y + 0.06, P));
    out.push(L(ribs.join(""), { tone: "lo" }));
  }
  out.push(faceY([[shop[0], shop[2]], [shop[0], shop[3]], [shop[1], shop[3]], [shop[1], shop[2]]], y + 0.06, { tone: "lo" }));
  // shutter box, then an awning or a sign board
  out.push(slab({ x: x0 + 1, y: y, w: 12, d: 1.1, r: 0.3 }, 10, 1.4, {}, 2));
  if (r() < 0.55) {
    out.push(slab({ x: x0 + 0.3, y: y, w: 13.4, d: 4.6, r: 0 }, 12, 0.6, {}, 1));
    out.push(L(k.onPlane([[x0 + 0.3, y + 4.6], [x1 - 0.3, y + 4.6]], 12, P), { tone: "faint" }));
  }
  const sign = { x: x0 + 1, y: y, w: 12, d: 0.8, r: 0.2 };
  out.push(slab(sign, 13, 4.2, {}, 1));
  const ry = y + 0.8;
  const w1 = 4 + r() * 6;
  out.push(faceY([[x0 + 2.4, 15.9], [x0 + 2.4 + w1, 15.9]], ry, { tone: "lo", free: true }), faceY([[x0 + 2.4, 14.4], [x0 + 2.4 + w1 * 0.6, 14.4]], ry, { tone: "faint", free: true }));
  // upper floors: windows (some behind iron grilles), a balcony, an air conditioner
  for (let f = 1; f < floors; f++) {
    const z0 = f * 12;
    out.push(faceY([[x0, z0], [x1, z0]], y, { tone: "faint" }));
    const wx = [x0 + 2.6, x1 - 2.6];
    out.push(darkRect(wx[0], wx[1], z0 + 3, z0 + 9.4, y + 0.02));
    out.push(faceY([[wx[0], z0 + 3], [wx[0], z0 + 9.4], [wx[1], z0 + 9.4], [wx[1], z0 + 3]], y + 0.03, { tone: "lo" }, true));
    out.push(faceY([[(wx[0] + wx[1]) / 2, z0 + 3], [(wx[0] + wx[1]) / 2, z0 + 9.4]], y + 0.03, { tone: "lo" }), faceY([[wx[0], z0 + 7.6], [wx[1], z0 + 7.6]], y + 0.03, { tone: "lo" }));
    if (r() < 0.45) {
      const bars = [];
      for (let x = wx[0] + 1; x < wx[1] - 0.4; x += 1.1) bars.push(k.onFaceY([[x, z0 + 3], [x, z0 + 9.4]], y + 0.04, P));
      out.push(L(bars.join(""), { tone: "faint" }));
    }
    const balcony = f === 1 && r() < 0.5;
    if (balcony) {
      out.push(slab({ x: x0 + 1.2, y: y, w: 11.6, d: 3, r: 0 }, z0, 0.8, {}, 1));
      const rail = [];
      for (let x = x0 + 1.6; x <= x1 - 1.5; x += 1.6) rail.push(k.segment([x, y + 2.8, z0 + 0.8], [x, y + 2.8, z0 + 4.4], P));
      out.push(L(rail.join(""), { tone: "lo" }), L(k.segment([x0 + 1.4, y + 2.8, z0 + 4.4], [x1 - 1.4, y + 2.8, z0 + 4.4], P), { tone: "mid" }));
    }
    if (r() < 0.5) {
      const ax = r() < 0.5 ? x0 + 1.2 : x1 - 5.6;
      const az = balcony ? z0 + 0.8 : z0 + 1.4;
      if (!balcony) out.push(L(k.segment([ax + 0.8, y, az], [ax + 0.8, y + 2.2, az], P) + k.segment([ax + 3.6, y, az], [ax + 3.6, y + 2.2, az], P), { tone: "lo" }));
      out.push(slab({ x: ax, y: y, w: 4.4, d: 2.4, r: 0.3 }, az, 3.2, {}, 2));
      const fan = { x: ax + 2.2, z: az + 1.6, y: y + 2.42, r: 1.2 };
      out.push(L(k.ringOnFaceY(fan.x, fan.z, fan.r, fan.y, P, 18), { tone: "lo" }));
      FANS.push(fan);
      out.push(`<path data-fan="${FANS.length - 1}" class="ix-line" data-tone="mid" d="${blades(fan, i)}"/>`);
    }
  }
  // roof: a parapet on the street edge, and on some roofs a water tank on legs or a stair hut and an aerial
  out.push(slab({ x: x0, y: y - 1.2, w: 14, d: 1.2, r: 0 }, H, 2, {}, 1));
  const roof = r();
  if (roof < 0.4) {
    const [tx, ty] = [x0 + 7, -52 + r() * 6];
    out.push(L([[-2, -2], [2, -2], [2, 2], [-2, 2]].map(([dx, dy]) => k.segment([tx + dx, ty + dy, H], [tx + dx, ty + dy, H + 4], P)).join(""), { tone: "lo" }));
    out.push(slab({ x: tx - 2.6, y: ty - 2.6, w: 5.2, d: 5.2, r: 0.3 }, H + 4, 0.6, {}, 2));
    out.push(cyl(tx, ty, 2.6, H + 4.6, 5, {}, 24), cyl(tx, ty, 1, H + 9.6, 0.6, {}, 12));
  } else if (roof < 0.65) {
    out.push(slab({ x: x0 + 3, y: -58, w: 8, d: 7, r: 0 }, H, 5, {}, 1));
    const ax = x0 + 9;
    out.push(L(k.segment([ax, -55, H + 5], [ax, -55, H + 13], P) + k.segment([ax - 2, -55, H + 11], [ax + 2, -55, H + 11], P) + k.segment([ax - 1.4, -55, H + 9], [ax + 1.4, -55, H + 9], P), { tone: "lo" }));
  }
  return out.join("");
}

function blades(fan, seed = 0) {
  return Array.from({ length: 3 }, (_, b) => {
    const a = seed + (b * Math.PI * 2) / 3;
    return k.onFaceY([[fan.x, fan.z], [fan.x + Math.cos(a) * fan.r * 0.85, fan.z + Math.sin(a) * fan.r * 0.85]], fan.y + 0.01, P);
  }).join("");
}

// ----- back sidewalk: poles and the cable tangle, hawker carts, the far platform's columns -----
const POLES = [-110, -62, -14, 34, 82, 126];
const POLE_Y = -34.4;

function backWalk() {
  const out = [slab({ x: X0, y: WALK_B[0], w: X1 - X0, d: WALK_B[1] - WALK_B[0], r: 0 }, 0, CURB, {}, 1)];
  out.push(L(k.onPlane([[X0, WALK_B[1] - 0.6], [X1, WALK_B[1] - 0.6]], CURB, P), { tone: "faint" }));
  for (const x of POLES) {
    out.push(slab({ x: x - 0.8, y: POLE_Y - 0.8, w: 1.6, d: 1.6, r: 0.3 }, CURB, 58, {}, 2));
    out.push(D([38, 41, 44, 47, 50, 53].map((z) => at([x, POLE_Y + 0.8, z])), { r: 0.42, tone: "hi" }));
  }
  // transformer on one pole, on a bracket
  out.push(L(k.segment([-14, POLE_Y + 0.8, 33], [-14, POLE_Y + 3.2, 33], P), { tone: "lo" }), cyl(-14, POLE_Y + 3.4, 1.8, 30, 6, {}, 18), cyl(-14, POLE_Y + 3.4, 2.1, 36, 0.6, {}, 18));
  const wires = [];
  const levels = [[53, 1.4], [50, 1.8], [47, 2.6], [44, 3.4], [41, 4.4], [38, 5.2]];
  for (let p = 0; p < POLES.length - 1; p++) {
    const r = rng(p * 31 + 7);
    for (const [z, sag] of levels) {
      const lift = r() * 1.6;
      wires.push(k.sagLine([POLES[p], POLE_Y + 0.85, z], [POLES[p + 1], POLE_Y + 0.85, z], sag + lift, P, 18));
    }
  }
  out.push(L(wires.join(""), { tone: "lo" }));
  // a slack coil hung on two poles
  for (const x of [-62, 82]) out.push(L(k.onFaceX(k.circlePlan(POLE_Y + 2.2, 35, 1.8, 16), x + 0.82, P, true), { tone: "lo" }));
  // far platform columns stand on this sidewalk
  for (const x of PORTALS) out.push(cyl(x, -31, 2.4, CURB, PLAT_Z[0] - 2 - CURB, { crease: "none" }, 20));
  for (const x of [-86, 10, 104]) out.push(cart(x));
  return out.join("");
}

function cart(x) {
  const y0 = -33.4;
  const out = [slab({ x: x - 4.5, y: y0, w: 9, d: 4, r: 0.6 }, 3, 4.6, {}, 2)];
  out.push(darkRect(x - 3.6, x + 3.6, 4, 7, y0 + 4.02));
  out.push(faceY([[x - 3.6, 5.5], [x + 3.6, 5.5]], y0 + 4.05, { tone: "faint" }));
  for (const wx of [x - 2.8, x + 2.8]) out.push(`<path class="ix-fill" d="${k.ringOnFaceY(wx, 1.9, 1.7, y0 + 4.1, P, 16)}"/>`, L(k.ringOnFaceY(wx, 1.9, 1.7, y0 + 4.1, P, 16), { tone: "mid" }), D([at([wx, y0 + 4.1, 1.9])], { r: 0.35 }));
  out.push(L(k.segment([x, y0 + 2, 7.6], [x, y0 + 2, 19.6], P), { tone: "mid" }));
  out.push(cyl(x, y0 + 2, 4.4, 19.6, 0.5, {}, 28));
  const ribs = k.radialTicks(x, y0 + 2, 4.3, 8, 1, 20.1, [3.5, 3.5], P);
  out.push(L(ribs.major, { tone: "faint" }), D([at([x, y0 + 2, 20.1])], { r: 0.4 }));
  return out.join("");
}

// ----- road -----
function road() {
  const out = [slab({ x: X0, y: ROAD[0], w: X1 - X0, d: ROAD[1] - ROAD[0], r: 0 }, 0, 0.3, { tone: "lo" }, 1)];
  const z = 0.3;
  out.push(L(k.onPlane([[X0, ROAD[0] + 1], [X1, ROAD[0] + 1]], z, P) + k.onPlane([[X0, ROAD[1] - 1], [X1, ROAD[1] - 1]], z, P), { tone: "lo" }));
  const dashes = [];
  for (const y of [-15, 13]) for (let x = X0 + 2; x < X1 - 6; x += 12) dashes.push(k.onPlane([[x, y], [x + 6, y]], z, P));
  out.push(L(dashes.join(""), { tone: "mid" }));
  // zebra crossing on the near carriageway, by the stairs
  const zebra = [];
  for (let x = 118; x < 128; x += 2.2) zebra.push(k.onPlane([[x, 0], [x, ROAD[1] - 2]], z, P));
  out.push(L(zebra.join(""), { tone: "mid" }));
  out.push(slab({ x: X0, y: WALK_F[0], w: X1 - X0, d: WALK_F[1] - WALK_F[0], r: 0 }, 0, CURB, {}, 1));
  out.push(L(k.onPlane([[X0, WALK_F[0] + 0.6], [X1, WALK_F[0] + 0.6]], CURB, P), { tone: "faint" }));
  return out.join("");
}

// ----- viaduct -----
function median() {
  const out = [slab({ x: X0, y: -7, w: X1 - X0, d: 6, r: 0 }, 0, 1.4, {}, 1)];
  for (const x of PIERS) {
    out.push(cyl(x, -4, 4.4, 1.4, DECK.z0 - 5 - 1.4, { crease: "none" }, 28));
    out.push(L(k.frontArc(x, -4, 4.4, 8, P, 20), { tone: "faint" }));
    out.push(slab({ x: x - 6, y: DECK.y0, w: 12, d: DECK.y1 - DECK.y0, r: 1 }, DECK.z0 - 5, 5, {}, 2));
    out.push(slab({ x: x - 4, y: -8, w: 8, d: 8, r: 1 }, DECK.z0 - 6, 1, { tone: "lo" }, 2));
  }
  return out.join("");
}

function farPlatform() {
  const out = [];
  for (const x of PORTALS) out.push(slab({ x: x - 4, y: -32.4, w: 8, d: PLAT_F.y1 - -32.4, r: 0.6 }, PLAT_Z[0] - 2, 2, {}, 2));
  out.push(slab({ x: ST.x0, y: PLAT_F.y0, w: ST.x1 - ST.x0, d: PLAT_F.y1 - PLAT_F.y0, r: 0 }, PLAT_Z[0], PLAT_Z[1] - PLAT_Z[0], {}, 1));
  return out.join("");
}

function deck() {
  const out = [slab({ x: X0, y: DECK.y0, w: X1 - X0, d: DECK.y1 - DECK.y0, r: 0 }, DECK.z0, DECK.z1 - DECK.z0, {}, 1)];
  out.push(faceY([[X0, DECK.z0 + 1.6], [ST.x0, DECK.z0 + 1.6]], DECK.y1, { tone: "faint" }), faceY([[ST.x1 + 8, DECK.z0 + 1.6], [X1, DECK.z0 + 1.6]], DECK.y1, { tone: "faint" }));
  // far parapet outside the station, where there is no far platform
  for (const [a, b] of [[X0, ST.x0], [ST.x1, X1]]) out.push(slab({ x: a, y: DECK.y0, w: b - a, d: 1, r: 0 }, DECK.z1, 4, {}, 1));
  // rails, third rail and sleepers on both tracks
  const rails = [];
  for (const c of [FAR_TRACK, NEAR_TRACK]) for (const dy of [-2.4, 2.4]) rails.push(k.onPlane([[X0, c + dy], [X1, c + dy]], DECK.z1 + 0.3, P));
  const third = [FAR_TRACK - 4.2, NEAR_TRACK + 4.2].map((y) => k.onPlane([[X0, y], [X1, y]], DECK.z1 + 0.5, P));
  const sleepers = [FAR_TRACK, NEAR_TRACK].map((c) => k.ticks(X0 + 1, X1 - 1, 2.6, 1000, c - 3.4, DECK.z1 + 0.1, [6.8, 6.8], P).minor + k.ticks(X0 + 1, X1 - 1, 2.6, 1000, c - 3.4, DECK.z1 + 0.1, [6.8, 6.8], P).major);
  out.push(L(sleepers.join(""), { tone: "faint" }), L(rails.join(""), { tone: "mid" }), L(third.join(""), { tone: "lo" }));
  return out.join("");
}

function roofColumns(y) {
  const out = [];
  for (let x = ST.x0 + 6; x <= ST.x1 - 4; x += 28) out.push(cyl(x, y, 0.9, PLAT_Z[1], ROOF_Z - PLAT_Z[1], { crease: "none" }, 12));
  return out.join("");
}

// a train is built standing at its stop, facing +x; the live script slides it along x
function train(trackY, id) {
  const out = [];
  const y0 = trackY - 5.5;
  for (let c = 0; c < CARS; c++) {
    const x0 = STOP_X + c * (CAR_L + CAR_GAP);
    for (const bx of [x0 + 5, x0 + CAR_L - 13]) out.push(slab({ x: bx, y: y0 + 1.5, w: 8, d: 8, r: 0.6 }, DECK.z1, 2, { tone: "lo" }, 2));
    if (c > 0) out.push(slab({ x: x0 - CAR_GAP - 0.5, y: y0 + 2, w: CAR_GAP + 1, d: 7, r: 0.4 }, DECK.z1 + 3, 9, { tone: "lo" }, 2));
    out.push(S(k.slab({ x: x0, y: y0, w: CAR_L, d: 11, r: 2 }, DECK.z1 + 2, 12, P, 4), { lit: true, crease: "lo" }));
    const fy = y0 + 11;
    const z = DECK.z1 + 2;
    out.push(faceY([[x0 + 1.4, z + 4.4], [x0 + CAR_L - 1.4, z + 4.4]], fy, { tone: "lo" }));
    const panes = [];
    const edges = [x0 + 1.6, ...CAR_DOORS.flatMap((d) => [x0 + d - 0.6, x0 + d + DOOR_W + 0.6]), x0 + CAR_L - 1.6];
    for (let e = 0; e < edges.length; e += 2) if (edges[e + 1] - edges[e] > 2) panes.push([edges[e] + 0.4, edges[e + 1] - 0.4]);
    for (const [a, b] of panes) out.push(darkRect(a, b, z + 6, z + 10, fy + 0.02), faceY([[a, z + 6], [b, z + 6], [b, z + 10], [a, z + 10]], fy + 0.03, { tone: "lo" }, true));
    for (const d of CAR_DOORS) {
      const a = x0 + d;
      out.push(faceY([[a, z + 0.6], [a, z + 10.8], [a + DOOR_W, z + 10.8], [a + DOOR_W, z + 0.6]], fy + 0.03, { tone: "mid" }, true), faceY([[a + DOOR_W / 2, z + 0.6], [a + DOOR_W / 2, z + 10.8]], fy + 0.03, { tone: "lo" }));
      out.push(darkRect(a + 0.5, a + DOOR_W / 2 - 0.4, z + 6, z + 10, fy + 0.04), darkRect(a + DOOR_W / 2 + 0.4, a + DOOR_W - 0.5, z + 6, z + 10, fy + 0.04));
    }
    for (const ux of [x0 + 7, x0 + CAR_L - 17]) out.push(slab({ x: ux, y: y0 + 2.5, w: 10, d: 6, r: 0.8 }, z + 12, 1.6, {}, 2));
  }
  // the cab ends
  out.push(slab({ x: STOP_X - 1.6, y: y0 + 0.8, w: 2, d: 9.4, r: 1 }, DECK.z1 + 2.6, 10.6, { tone: "hi" }, 3));
  out.push(slab({ x: STOP_X + TRAIN_L - 0.4, y: y0 + 0.8, w: 2, d: 9.4, r: 1 }, DECK.z1 + 2.6, 10.6, { tone: "hi" }, 3));
  return `<g data-train="${id}">${out.join("")}</g>`;
}

const DOOR_OPENINGS = Array.from({ length: CARS }, (_, c) => CAR_DOORS.map((d) => STOP_X + c * (CAR_L + CAR_GAP) + d)).flat();

function nearPlatform() {
  const out = [];
  for (const x of PORTALS) {
    out.push(cyl(x, 17, 2.6, 0.3, PLAT_Z[0] - 2 - 0.3, { crease: "none" }, 20));
    out.push(slab({ x: x - 4, y: PLAT_N.y0, w: 8, d: 10, r: 0.6 }, PLAT_Z[0] - 2, 2, {}, 2));
  }
  out.push(slab({ x: ST.x0, y: PLAT_N.y0, w: ST.x1 - ST.x0, d: PLAT_N.y1 - PLAT_N.y0, r: 0 }, PLAT_Z[0], PLAT_Z[1] - PLAT_Z[0], {}, 1));
  out.push(L(k.onPlane([[ST.x0, PLAT_N.y0 + 2.2], [ST.x1, PLAT_N.y0 + 2.2]], PLAT_Z[1], P), { tone: "lo" }));
  out.push(faceY([[ST.x0, PLAT_Z[0] + 3], [ST.x1, PLAT_Z[0] + 3]], PLAT_N.y1, { tone: "faint" }), faceY([[ST.x0, PLAT_Z[0] + 7], [ST.x1, PLAT_Z[0] + 7]], PLAT_N.y1, { tone: "faint" }));
  // benches and bins along the back of the platform
  for (const x of [-50, -8, 34]) {
    out.push(slab({ x: x, y: 16.4, w: 8, d: 2, r: 0.4 }, PLAT_Z[1] + 1.4, 0.6, {}, 2));
    out.push(L(k.segment([x + 1, 17.4, PLAT_Z[1]], [x + 1, 17.4, PLAT_Z[1] + 1.4], P) + k.segment([x + 7, 17.4, PLAT_Z[1]], [x + 7, 17.4, PLAT_Z[1] + 1.4], P), { tone: "lo" }));
  }
  for (const x of [-60, 14, 56]) out.push(cyl(x, 17.2, 0.9, PLAT_Z[1], 2.4, {}, 12));
  // half-height screen doors: sliding leaves first, then the fixed panels that hide them when open
  const y0 = PLAT_N.y0 + 0.3;
  DOOR_OPENINGS.forEach((x, i) => {
    out.push(`<g data-leaf="${i}a">${slab({ x: x, y: y0 + 0.1, w: DOOR_W / 2, d: 0.3, r: 0 }, PLAT_Z[1], 4, { tone: "hi" }, 1)}</g>`);
    out.push(`<g data-leaf="${i}b">${slab({ x: x + DOOR_W / 2, y: y0 + 0.1, w: DOOR_W / 2, d: 0.3, r: 0 }, PLAT_Z[1], 4, { tone: "hi" }, 1)}</g>`);
  });
  const fixed = [ST.x0 + 1, ...DOOR_OPENINGS.flatMap((x) => [x, x + DOOR_W]), ST.x1 - 1];
  for (let e = 0; e < fixed.length; e += 2) {
    const [a, b] = [fixed[e], fixed[e + 1]];
    if (b - a < 0.6) continue;
    out.push(slab({ x: a, y: y0 + 0.5, w: b - a, d: 0.5, r: 0 }, PLAT_Z[1], 4.2, {}, 1));
  }
  // one continuous head rail ties the panels into a barrier, with a post at every door jamb
  out.push(slab({ x: ST.x0 + 1, y: y0 + 0.4, w: ST.x1 - ST.x0 - 2, d: 0.7, r: 0.2 }, PLAT_Z[1] + 4.2, 0.6, { tone: "hi" }, 1));
  return out.join("");
}

function stairs() {
  // open stair: two sloped stringers with thin treads between them, landing on a column-borne landing
  const out = [];
  out.push(cyl(72, 25, 2, CURB, 34.8, { crease: "none" }, 16));
  out.push(slab({ x: ST.x1, y: PLAT_N.y0, w: 8, d: 18, r: 0 }, PLAT_Z[0] + 6, 4, {}, 1));
  const steps = 15;
  const sx = ST.x1 + 8;
  const run = 2.8;
  const rise = 2.5;
  const end = sx + run * steps;
  const stringer = (y) => {
    const pts = [[sx, PLAT_Z[1]], [end, PLAT_Z[1] - rise * steps], [end, CURB], [end - 3, CURB], [sx, PLAT_Z[1] - 4.2]];
    const d = k.onFaceY(pts, y, P, true);
    return `<path class="ix-fill" d="${d}"/><path class="ix-shade" data-s="3" d="${d}"/>` + L(d, { tone: "mid" });
  };
  out.push(stringer(22.4));
  for (let i = 0; i < steps; i++) {
    const top = PLAT_Z[1] - rise * (i + 1);
    out.push(slab({ x: sx + run * i, y: 22.6, w: run, d: 5, r: 0 }, top - 0.8, 0.8, {}, 1));
  }
  out.push(stringer(27.8));
  const rail = [];
  for (const y of [22.4, 27.8]) {
    const railAt = (x) => PLAT_Z[1] + 3.6 - (x - sx) * (rise / run);
    rail.push(k.segment([sx, y, railAt(sx)], [end, y, railAt(end)], P));
    for (let i = 1; i < steps; i += 3) {
      const x = sx + run * i + run / 2;
      rail.push(k.segment([x, y, PLAT_Z[1] - rise * (i + 1) + 0.6], [x, y, railAt(x)], P));
    }
  }
  out.push(L(rail.join(""), { tone: "mid" }));
  return out.join("");
}

function roof() {
  const out = [];
  out.push(slab({ x: ST.x0 - 2, y: PLAT_F.y0 - 1, w: ST.x1 - ST.x0 + 4, d: PLAT_N.y1 - PLAT_F.y0 + 3, r: 1.5 }, ROOF_Z, 1.4, {}, 3));
  out.push(slab({ x: ST.x0 - 2, y: -12, w: ST.x1 - ST.x0 + 4, d: 18, r: 1.5 }, ROOF_Z + 1.4, 2, {}, 3));
  const ribs = [];
  for (let x = ST.x0 + 2; x < ST.x1; x += 6) {
    ribs.push(k.onPlane([[x, PLAT_F.y0 + 0.4], [x, -12]], ROOF_Z + 1.4, P), k.onPlane([[x, 6], [x, PLAT_N.y1 + 1.6]], ROOF_Z + 1.4, P));
  }
  out.push(L(ribs.join(""), { tone: "faint" }));
  out.push(L(k.planOutline({ x: ST.x0, y: -10, w: ST.x1 - ST.x0, d: 14, r: 1 }, ROOF_Z + 3.4, P), { tone: "lo" }));
  return out.join("");
}

// ----- front sidewalk -----
function frontWalk() {
  const out = [];
  // bus stop shelter
  const sx = -104;
  for (const px of [sx, sx + 18]) out.push(L(k.segment([px, 29.6, CURB], [px, 29.6, 10], P), { tone: "mid" }));
  out.push(slab({ x: sx - 1, y: 25, w: 20, d: 6, r: 0.6 }, 10, 0.7, {}, 2));
  out.push(slab({ x: sx + 2, y: 28.2, w: 14, d: 1.8, r: 0.3 }, CURB + 2.6, 0.5, {}, 2));
  out.push(L(k.segment([sx + 4, 29, CURB], [sx + 4, 29, CURB + 2.6], P) + k.segment([sx + 14, 29, CURB], [sx + 14, 29, CURB + 2.6], P), { tone: "lo" }));
  out.push(slab({ x: sx + 22, y: 21.8, w: 0.6, d: 0.6, r: 0 }, CURB, 11, {}, 1), slab({ x: sx + 20.4, y: 21.6, w: 3.8, d: 0.8, r: 0.3 }, CURB + 8.4, 2.6, {}, 2));
  // bollards along the curb
  for (let x = -76; x < 64; x += 14) out.push(cyl(x, 21.4, 0.6, CURB, 2.4, {}, 10));
  // two poles at the west end, by the bus stop, with their own short span of cable
  for (const x of [-126, -78]) {
    out.push(slab({ x: x - 0.8, y: 29.2, w: 1.6, d: 1.6, r: 0.3 }, CURB, 52, {}, 2));
    out.push(D([42, 45, 48].map((z) => at([x - 0.82, 30, z])), { r: 0.42, tone: "hi" }));
  }
  out.push(L([42, 45, 48].map((z, i) => k.sagLine([-126 - 0.82, 30, z], [-78 - 0.82, 30, z], 1.6 + i, P)).join(""), { tone: "lo" }));
  return out.join("");
}

// ----- vehicles: built at x = 0 and slid along their lane by the live script -----
function bus() {
  const y0 = -26;
  const out = [slab({ x: -18, y: y0, w: 36, d: 8, r: 1.2 }, 1.6, 10, {}, 3)];
  const fy = y0 + 8;
  out.push(darkRect(-16, 14, 6.6, 10, fy + 0.02), faceY([[-16, 6.6], [14, 6.6], [14, 10], [-16, 10]], fy + 0.03, { tone: "lo" }, true));
  const mull = [];
  for (let x = -12; x < 14; x += 4) mull.push(k.onFaceY([[x, 6.6], [x, 10]], fy + 0.03, P));
  out.push(L(mull.join(""), { tone: "lo" }));
  for (const wx of [-11, 11]) out.push(`<path class="ix-fill" d="${k.ringOnFaceY(wx, 1.9, 1.9, fy + 0.05, P, 16)}"/>`, L(k.ringOnFaceY(wx, 1.9, 1.9, fy + 0.05, P, 16), { tone: "mid" }));
  out.push(slab({ x: -8, y: y0 + 2, w: 10, d: 4, r: 0.6 }, 11.6, 1.2, {}, 2));
  return `<g data-car="bus">${out.join("")}</g>`;
}

function taxi() {
  const y0 = 4;
  const out = [slab({ x: -6.5, y: y0, w: 13, d: 5.6, r: 1 }, 1, 3, {}, 3)];
  out.push(slab({ x: -3.6, y: y0 + 0.4, w: 7, d: 4.8, r: 1 }, 4, 2.6, {}, 3));
  out.push(darkRect(-3.1, 3, 4.4, 6.2, y0 + 5.22), L(k.onFaceY([[0, 4.4], [0, 6.2]], y0 + 5.24, P), { tone: "lo" }));
  for (const wx of [-4, 4]) out.push(`<path class="ix-fill" d="${k.ringOnFaceY(wx, 1.3, 1.3, y0 + 5.62, P, 14)}"/>`, L(k.ringOnFaceY(wx, 1.3, 1.3, y0 + 5.62, P, 14), { tone: "mid" }));
  out.push(slab({ x: -1.2, y: y0 + 1.8, w: 2.4, d: 1.4, r: 0.3 }, 6.6, 0.9, {}, 2));
  return `<g data-car="taxi">${out.join("")}</g>`;
}

function tuktuk() {
  const y0 = 4.6;
  const out = [slab({ x: -4, y: y0, w: 8, d: 4.6, r: 1 }, 1.2, 2.6, {}, 3)];
  for (const [px, py] of [[-3.4, y0 + 0.4], [-3.4, y0 + 4.2], [1.8, y0 + 0.4], [1.8, y0 + 4.2]]) out.push(L(k.segment([px, py, 3.8], [px, py, 7.6], P), { tone: "mid" }));
  out.push(slab({ x: -4.4, y: y0 - 0.2, w: 7.6, d: 5, r: 1 }, 7.6, 0.8, {}, 3));
  out.push(`<path class="ix-fill" d="${k.ringOnFaceY(-2.4, 1.1, 1.1, y0 + 4.62, P, 14)}"/>`, L(k.ringOnFaceY(-2.4, 1.1, 1.1, y0 + 4.62, P, 14), { tone: "mid" }));
  return `<g data-car="tuktuk">${out.join("")}</g>`;
}

// ----- assemble, back to front -----
const shophouses = Array.from({ length: 18 }, (_, i) => shophouse(i)).join("");
const clipTrain = k.boxHull({ x: X0, y: DECK.y0, w: X1 - X0, d: DECK.y1 - DECK.y0 + 2 }, DECK.z1, DECK.z1 + 20, P);
const clipRoad = k.boxHull({ x: X0, y: ROAD[0], w: X1 - X0, d: ROAD[1] - ROAD[0] }, 0, 16, P);
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A 1:300 model of a Bangkok street on a plinth. At the back, a row of eighteen three to five storey shophouses with shutters, awnings, sign boards, iron window grilles, air conditioners and water tanks. In front, electricity poles carry a sagging tangle of cables over hawker carts with umbrellas. A four-lane road runs under an elevated BTS Skytrain viaduct on round piers, with a roofed station, two platforms with half-height screen doors and a stair down to the near sidewalk. Two three-car trains arrive, stop with their doors open and pull away; a bus, a taxi and a tuk-tuk drive below.",
  body: [
    `<defs><clipPath id="ix-train"><path d="${clipTrain}"/></clipPath><clipPath id="ix-road"><path d="${clipRoad}"/></clipPath></defs>`,
    plinth(),
    shophouses,
    backWalk(),
    road(),
    `<g clip-path="url(#ix-road)">${bus()}</g>`,
    median(),
    `<g clip-path="url(#ix-road)">${taxi()}${tuktuk()}</g>`,
    farPlatform(),
    deck(),
    roofColumns(PLAT_F.y0 + 1.6),
    `<g clip-path="url(#ix-train)">${train(FAR_TRACK, "far")}${train(NEAR_TRACK, "near")}</g>`,
    [[X0, ST.x0], [ST.x1 + 8, X1]].map(([a, b]) => slab({ x: a, y: DECK.y1 - 1, w: b - a, d: 1, r: 0 }, DECK.z1, 4, {}, 1)).join(""),
    nearPlatform(),
    roofColumns(PLAT_N.y1 - 1.4),
    stairs(),
    roof(),
    frontWalk(),
  ],
});

const card = k.cardHtml({
  fig: "Fig 3",
  title: "Bangkok · BTS",
  hint: "Click · Space: call a train",
  readout: "platform 1 · dwell · doors open",
  keys: [
    { mark: "lit", label: "BTS train" },
    { mark: "mid", label: "street, viaduct and shophouses" },
  ],
  caption:
    "A 1:300 model (1 unit = 0.3 m): a Skytrain station over four lanes, with shophouses behind. Each train runs in at 65 km/h, brakes at 2.1 m/s² to stop at the platform, dwells 6 s with its doors open and pulls away at 1.5 m/s²; the two tracks run half a cycle apart.",
  body: svg,
});

const live = `${k.runtimeSource(P)}
${MODEL}
const FANS = ${JSON.stringify(FANS)};
const SHUTTERS = ${JSON.stringify(SHUTTERS)};
const DOORS = ${DOOR_OPENINGS.length}, DOOR_W = ${DOOR_W}, X0 = ${X0}, X1 = ${X1};
const stage = document.querySelector(".ix-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const q = (sel) => svg.querySelector(sel);
const nearEl = q('[data-train="near"]'), farEl = q('[data-train="far"]');
const fanEls = FANS.map((_, i) => q('[data-fan="' + i + '"]'));
const shutterEls = SHUTTERS.map((_, i) => q('[data-shutter="' + i + '"]').children);
const leaves = Array.from({ length: DOORS }, (_, i) => [q('[data-leaf="' + i + 'a"]'), q('[data-leaf="' + i + 'b"]')]);
const cars = { bus: q('[data-car="bus"]'), taxi: q('[data-car="taxi"]'), tuktuk: q('[data-car="tuktuk"]') };

let clock = 0, nearShift = 0, farShift = CYCLE / 2;
const lane = (t, speed, offset, span) => { const len = X1 - X0 + span * 2; return X0 - span + ((((t * speed + offset) % len) + len) % len); };
const faceLine = (fan, a) => { const [x1, y1] = iso([fan.x, fan.y + 0.01, fan.z]); const [x2, y2] = iso([fan.x + Math.cos(a) * fan.r * 0.85, fan.y + 0.01, fan.z + Math.sin(a) * fan.r * 0.85]); return "M" + x1.toFixed(2) + " " + y1.toFixed(2) + "L" + x2.toFixed(2) + " " + y2.toFixed(2); };
const faceRect = (s, z0, z1) => { const pts = [[s.x0, z0], [s.x1, z0], [s.x1, z1], [s.x0, z1]].map(([x, z]) => iso([x, s.y, z])); return "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z"; };

function draw(still) {
  const near = trainAt(clock + nearShift);
  const far = trainAt(clock + farShift);
  // the near train runs east (+x); the far train runs west, so its offsets are mirrored
  nearEl.setAttribute("transform", along([Number.isFinite(near.x) ? near.x : 1e4, 0, 0]));
  farEl.setAttribute("transform", along([Number.isFinite(far.x) ? -far.x : 1e4, 0, 0]));
  leaves.forEach(([a, b]) => { a.setAttribute("transform", along([-DOOR_W / 2 * near.doors, 0, 0])); b.setAttribute("transform", along([DOOR_W / 2 * near.doors, 0, 0])); });
  fanEls.forEach((el, i) => { const a = (still ? 0 : clock * (7 + (i % 3))) + i; el.setAttribute("d", [0, 1, 2].map((b) => faceLine(FANS[i], a + b * 2.094)).join("")); });
  SHUTTERS.forEach((s, i) => {
    // each shop raises its shutter for part of a 24 s day, then lowers it
    const u = ((clock / 24 + s.phase) % 1);
    const open = still ? 0.5 : Math.min(1, Math.max(0, Math.min(u * 8, (0.75 - u) * 8)));
    const bottom = s.z1 - (1 - open) * (s.z1 - s.z0);
    const [fill, ribs] = shutterEls[i];
    fill.setAttribute("d", open < 0.999 ? faceRect(s, bottom, s.z1) : "");
    let d = "";
    for (let z = s.z1 - 0.9; z > bottom; z -= 0.9) { const [a, b] = [iso([s.x0, s.y + 0.01, z]), iso([s.x1, s.y + 0.01, z])]; d += "M" + a[0].toFixed(2) + " " + a[1].toFixed(2) + "L" + b[0].toFixed(2) + " " + b[1].toFixed(2); }
    ribs.setAttribute("d", d);
  });
  cars.bus.setAttribute("transform", along([lane(clock, -14, 60, 30), 0, 0]));
  cars.taxi.setAttribute("transform", along([lane(clock, 20, 0, 12), 0, 0]));
  cars.tuktuk.setAttribute("transform", along([lane(clock, 16, 150, 12), 0, 0]));
  const line = (name, s) => s.phase === "dwell" ? name + " · doors " + (s.doors > 0.5 ? "open" : s.doors > 0 ? "moving" : "closed") + " · departs in " + Math.ceil(s.left) + " s"
    : s.phase === "away" ? name + " · next train in " + Math.ceil(s.left + 8.6) + " s"
    : name + " · " + s.phase + " " + Math.round(kmh(s.v)) + " km/h";
  // talk about the train the reader can see: one standing at a platform, else the one nearest the station
  const shown = [["platform 1", near], ["platform 2", far]].map(([n, s]) => ({ n, s, d: s.phase === "dwell" ? -1 : Number.isFinite(s.x) && Math.abs(s.x) < 260 ? Math.abs(s.x) : 1e9 }));
  shown.sort((a, b) => a.d - b.d);
  const text = line(shown[0].n, shown[0].s);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}

function tick(dt, still) {
  if (still) { draw(true); return false; }
  clock += dt;
  draw(false);
  return true;
}

const wake = loop(stage, tick);
const call = () => {
  // a train that is away is brought to the start of its braking run
  for (const which of ["near", "far"]) {
    const shift = which === "near" ? nearShift : farShift;
    const s = trainAt(clock + shift);
    if (s.phase === "away") { const t = (((clock + shift) % CYCLE) + CYCLE) % CYCLE; const add = ARRIVAL_START - t; if (which === "near") nearShift += add; else farShift += add; break; }
  }
  wake();
};
stage.addEventListener("pointerdown", (e) => { e.preventDefault(); stage.focus({ preventScroll: true }); call(); });
stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); call(); } });
draw(stillQuery.matches);
wake();
`;

for (const [suffix, theme] of [["", "auto"], ["-dark", "dark"], ["-light", "light"]]) {
  const file = join(HERE, `bangkok-bts${suffix}.html`);
  writeFileSync(file, k.pageHtml({ title: "Bangkok BTS", body: card, script: live, theme, width: 760 }));
  console.log("wrote", file);
}
