// iso-explainer kit: isometric solids, lines and a framed card, written as SVG strings.
// World: x and y on the floor, z up, about 1 unit per px of the real thing.
// The viewer sits toward +x +y and above, so bigger depthOf() is nearer and is painted later.

const RAD = Math.PI / 180;
export const SHADES = 4;

/** @typedef {[number, number]} Pt2 */
/** @typedef {[number, number, number]} Pt3 */
/** @typedef {{ x: number, y: number, w: number, d: number, r: number }} Plan */
/** @typedef {{ origin: Pt2, scale: number, azimuth: number, elevation: number }} Camera */

export function camera({ origin = [0, 0], scale = 1, azimuth = 45, elevation = 30 } = {}) {
  return { origin, scale, azimuth, elevation };
}

function basis(P) {
  const a = P.azimuth * RAD;
  const e = P.elevation * RAD;
  return { sa: Math.sin(a), ca: Math.cos(a), se: Math.sin(e), ce: Math.cos(e), k: P.scale };
}

/** World point to screen point. */
export function iso([x, y, z], P) {
  const { sa, ca, se, ce, k } = basis(P);
  return [P.origin[0] + (x * sa - y * ca) * k, P.origin[1] + ((x * ca + y * sa) * se - z * ce) * k];
}

/** Larger is nearer the viewer. */
export function depthOf([x, y, z], P) {
  const { sa, ca, se, ce } = basis(P);
  return (x * ca + y * sa) * ce + z * se;
}

/** Floor direction that points at the viewer. */
export function toViewer(P) {
  const { sa, ca } = basis(P);
  return [ca, sa];
}

/** Sort anything with a world anchor back to front. */
export function byDepth(items, P, anchor = (item) => item) {
  return [...items].sort((a, b) => depthOf(anchor(a), P) - depthOf(anchor(b), P));
}

/** Scale and centre a camera so every point fits in width x height minus pad. */
export function fit(points, width, height, { pad = 28, azimuth = 45, elevation = 30 } = {}) {
  const probe = camera({ azimuth, elevation });
  const flat = points.map((p) => iso(p, probe));
  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((width - pad * 2) / (x1 - x0 || 1), (height - pad * 2) / (y1 - y0 || 1));
  const origin = [width / 2 - ((x0 + x1) / 2) * scale, height / 2 - ((y0 + y1) / 2) * scale];
  return camera({ origin, scale, azimuth, elevation });
}

const num = (v) => {
  const t = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return t === "-0" ? "0" : t;
};

export function pathOf(points, closed = false) {
  if (!points.length) return "";
  return points.map(([x, y], i) => `${i ? "L" : "M"}${num(x)} ${num(y)}`).join("") + (closed ? "Z" : "");
}

export function roundedPlan({ x, y, w, d, r }, steps = 6) {
  const rad = Math.max(0, Math.min(r, w / 2, d / 2));
  const out = [];
  const corners = [
    [x + w - rad, y + rad, -90],
    [x + w - rad, y + d - rad, 0],
    [x + rad, y + d - rad, 90],
    [x + rad, y + rad, 180],
  ];
  for (const [cx, cy, start] of corners) {
    const n = rad > 0 ? steps : 0;
    for (let i = 0; i <= n; i++) {
      const a = (start + (n ? (90 * i) / n : 45)) * RAD;
      out.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
    }
  }
  return out;
}

export function circlePlan(cx, cy, r, steps = 40) {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export const insetPlan = ({ x, y, w, d, r }, by) => ({ x: x + by, y: y + by, w: w - by * 2, d: d - by * 2, r: Math.max(0, r - by) });

export function corners({ x, y, w, d }, inset = 0) {
  return [
    [x + inset, y + inset],
    [x + w - inset, y + inset],
    [x + w - inset, y + d - inset],
    [x + inset, y + d - inset],
  ];
}

export function boxPoints({ x, y, w, d }, z0, z1) {
  return corners({ x, y, w, d }).flatMap(([px, py]) => [[px, py, z0], [px, py, z1]]);
}

function area(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    s += ax * by - bx * ay;
  }
  return s / 2;
}

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi = [];
  for (let i = p.length - 1; i >= 0; i--) {
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p[i]) <= 0) hi.pop();
    hi.push(p[i]);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

/**
 * Extrude a convex floor ring from z up by height.
 * Returns the silhouette (fill + edge), the top face, the visible sides bucketed into
 * four tones by how much each one faces the light, and the crease where the top meets them.
 */
export function extrude(ring, z, height, P) {
  const ccw = area(ring) > 0;
  const [vx, vy] = toViewer(P);
  const { sa, ca } = basis(P);
  const light = [-sa, ca];
  const n = ring.length;
  const normals = ring.map(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return ccw ? [(by - ay) / len, -(bx - ax) / len] : [-(by - ay) / len, (bx - ax) / len];
  });
  const facing = normals.map(([nx, ny]) => nx * vx + ny * vy > 1e-9);
  const top = ring.map(([x, y]) => iso([x, y, z + height], P));
  const bottom = ring.map(([x, y]) => iso([x, y, z], P));
  const shades = Array.from({ length: SHADES }, () => []);
  const crease = [];
  if (height > 0) {
    for (let i = 0; i < n; i++) {
      if (!facing[i]) continue;
      const j = (i + 1) % n;
      const lit = (normals[i][0] * light[0] + normals[i][1] * light[1] + 1) / 2;
      const s = Math.min(SHADES - 1, Math.floor(lit * SHADES));
      shades[s].push(pathOf([top[i], top[j], bottom[j], bottom[i]], true));
      crease.push(pathOf([top[i], top[j]]));
    }
  }
  const silhouette = pathOf(hull([...top, ...bottom]), true);
  return { fill: silhouette, edge: silhouette, top: pathOf(top, true), shades: shades.map((s) => s.join("")), crease: crease.join("") };
}

export const slab = (plan, z, height, P, steps = 6) => extrude(roundedPlan(plan, steps), z, height, P);
export const cylinder = (cx, cy, r, z, height, P, steps = 40) => extrude(circlePlan(cx, cy, r, steps), z, height, P);

/** Lines lying on a horizontal plane at z. */
export const onPlane = (points, z, P, closed = false) => pathOf(points.map(([x, y]) => iso([x, y, z], P)), closed);
export const planOutline = (plan, z, P) => onPlane(roundedPlan(plan), z, P, true);
export const ring = (cx, cy, r, z, P, steps = 40) => onPlane(circlePlan(cx, cy, r, steps), z, P, true);
export const segment = (a, b, P) => pathOf([iso(a, P), iso(b, P)]);

/** The front half of a circle at height z: a groove or band around a round part. */
export function frontArc(cx, cy, r, z, P, steps = 24) {
  const [vx, vy] = toViewer(P);
  const mid = Math.atan2(vy, vx);
  return pathOf(
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = mid - Math.PI / 2 + (Math.PI * i) / steps;
      return iso([cx + r * Math.cos(a), cy + r * Math.sin(a), z], P);
    }),
  );
}

/** A path through world points. */
export const poly3 = (points, P, closed = false) => pathOf(points.map((p) => iso(p, P)), closed);

/** Lines on a vertical face whose normal is ±y, at y = face; points are [x, z]. */
export const onFaceY = (points, y, P, closed = false) => poly3(points.map(([x, z]) => [x, y, z]), P, closed);

/** Lines on a vertical face whose normal is ±x, at x = face; points are [y, z]. */
export const onFaceX = (points, x, P, closed = false) => poly3(points.map(([y, z]) => [x, y, z]), P, closed);

/** A rectangle on a ±y face, optionally with rounded corners. */
export function rectOnFaceY(x0, x1, z0, z1, y, P, r = 0) {
  if (!r) return onFaceY([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, P, true);
  const pts = roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 4);
  return onFaceY(pts, y, P, true);
}

/** A circle on a ±y face. */
export const ringOnFaceY = (cx, cz, r, y, P, steps = 24) => onFaceY(circlePlan(cx, cz, r, steps), y, P, true);

/** Screen silhouette of a world box: use it as a clipPath where the model is cut off at its plinth. */
export const boxHull = (plan, z0, z1, P) => pathOf(hull(boxPoints(plan, z0, z1).map((p) => iso(p, P))), true);

/** A hanging cable between two world points: a catenary-like sag of `sag` units at mid-span. */
export function sagLine(a, b, sag, P, steps = 16) {
  return poly3(
    Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)];
    }),
    P,
  );
}

/**
 * Screen region above the plane z for a vertical rod of radius r leaving a gland at (cx, cy):
 * everything above the rod's front rim. Use it as a clipPath so a sliding rod vanishes into its gland
 * instead of being painted over the part it enters.
 */
export function clipAbove(cx, cy, r, z, P, steps = 24) {
  const [vx, vy] = toViewer(P);
  const mid = Math.atan2(vy, vx);
  const rim = Array.from({ length: steps + 1 }, (_, i) => {
    const a = mid - Math.PI / 2 + (Math.PI * i) / steps;
    return iso([cx + r * Math.cos(a), cy + r * Math.sin(a), z], P);
  });
  return pathOf([[rim[0][0], -1e4], ...rim, [rim[rim.length - 1][0], -1e4]], true);
}

/** Vertical knurl lines across the visible half of a round part. */
export function knurl(cx, cy, r, z0, z1, count, P) {
  const [vx, vy] = toViewer(P);
  const mid = Math.atan2(vy, vx);
  const out = [];
  for (let i = 1; i < count; i++) {
    const a = mid - Math.PI / 2 + (Math.PI * i) / count;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    out.push(segment([x, y, z0], [x, y, z1], P));
  }
  return out.join("");
}

/** Ticks that hang from a strip edge at y = edge, along x, on the plane z. */
export function ticks(from, to, step, every, edge, z, [minor, major], P) {
  const lo = [];
  const hi = [];
  for (let i = 0, x = from; x <= to + 1e-6; i++, x += step) {
    const isMajor = i % every === 0;
    (isMajor ? hi : lo).push(segment([x, edge, z], [x, edge + (isMajor ? major : minor), z], P));
  }
  return { minor: lo.join(""), major: hi.join("") };
}

/** Ticks on a vertical face whose normal is +x, at x = face, starting at y = edge. */
export function faceTicks(face, edge, levels, every, [minor, major], P) {
  const lo = [];
  const hi = [];
  levels.forEach((z, i) => {
    const isMajor = i % every === 0;
    (isMajor ? hi : lo).push(segment([face, edge, z], [face, edge + (isMajor ? major : minor), z], P));
  });
  return { minor: lo.join(""), major: hi.join("") };
}

export function radialTicks(cx, cy, r, count, every, z, [minor, major], P, from = 0, span = Math.PI * 2) {
  const lo = [];
  const hi = [];
  for (let i = 0; i <= count; i++) {
    if (span >= Math.PI * 2 && i === count) break;
    const a = from + (span * i) / count;
    const len = i % every === 0 ? major : minor;
    const d = segment([cx + r * Math.cos(a), cy + r * Math.sin(a), z], [cx + (r - len) * Math.cos(a), cy + (r - len) * Math.sin(a), z], P);
    (i % every === 0 ? hi : lo).push(d);
  }
  return { minor: lo.join(""), major: hi.join("") };
}

/** A soft shadow under a footprint. */
export const haloOf = (plan, z, P) => slab(plan, z, 0.01, P).fill;

/** SVG transform that moves a part built at rest by a world vector. */
export function translateAlong(P, [dx, dy, dz]) {
  const [ax, ay] = iso([0, 0, 0], P);
  const [bx, by] = iso([dx, dy, dz], P);
  return `translate(${num(bx - ax)} ${num(by - ay)})`;
}

/** Matrix that lays text flat on the top plane z at a floor point, reading along +x or +y. */
export function topMatrix([x, y], z, P, along = "x") {
  const o = iso([x, y, z], P);
  const u = iso(along === "x" ? [x + 1, y, z] : [x, y - 1, z], P);
  const v = iso(along === "x" ? [x, y + 1, z] : [x + 1, y, z], P);
  return `matrix(${[u[0] - o[0], u[1] - o[1], v[0] - o[0], v[1] - o[1], o[0], o[1]].map((n) => n.toFixed(4)).join(" ")})`;
}

// ---------- markup ----------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** tone: hi | mid | lo | faint. lit marks the one part the reader should watch. */
export function solidSvg(paths, { tone = "mid", lit = false, crease = "faint", flat = false } = {}) {
  const out = [`<path class="ix-fill" d="${paths.fill}"/>`];
  if (!flat) {
    paths.shades.forEach((d, s) => d && out.push(`<path class="ix-shade" data-s="${s}" d="${d}"/>`));
    out.push(`<path class="ix-top" d="${paths.top}"/>`);
  }
  if (crease !== "none" && paths.crease) out.push(`<path class="ix-line" data-tone="${crease}" d="${paths.crease}"/>`);
  out.push(`<path class="ix-line ix-edge" data-tone="${lit ? "lit" : tone}" d="${paths.edge}"/>`);
  return `<g class="ix-solid"${lit ? " data-lit" : ""}>${out.join("")}</g>`;
}

export const lineSvg = (d, { tone = "lo", free = false, width } = {}) =>
  d ? `<path class="ix-line" data-tone="${tone}"${free ? " data-free" : ""}${width ? ` style="stroke-width:${width}"` : ""} d="${d}"/>` : "";

export const dotsSvg = (points, { r = 0.5, tone = "mid" } = {}) =>
  `<g class="ix-dots" data-tone="${tone}">${points.map(([x, y]) => `<circle cx="${num(x)}" cy="${num(y)}" r="${r}"/>`).join("")}</g>`;

/** A connector whose two ends land on parts as terminal dots. */
export function wireSvg(points, { tone = "lo", r = 1.1 } = {}) {
  const end = ([x, y]) => `<circle class="ix-wire-end" data-tone="${tone}" cx="${num(x)}" cy="${num(y)}" r="${r}"/>`;
  return `<g>${lineSvg(pathOf(points), { tone })}${end(points[0])}${end(points[points.length - 1])}</g>`;
}

export const faceText = (transform, text, { size = 3, tone = "lo", anchor = "middle" } = {}) =>
  `<text class="ix-face-text" data-tone="${tone}" transform="${transform}" font-size="${size}" text-anchor="${anchor}">${esc(text)}</text>`;

export const haloSvg = (d, blur = 8) => `<path class="ix-halo" style="filter:blur(${blur}px)" d="${d}"/>`;

export function figureSvg({ width, height, label, body }) {
  return `<svg class="ix-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${[].concat(body).join("")}</svg>`;
}

/** The card: Fig n top left, title top right, hint bottom left, live readout bottom right. Words stay out of the drawing. */
export function cardHtml({ fig, title, hint, readout = "", caption = "", keys = [], body, interactive = true }) {
  const corner = (k, t, extra = "") => `<span class="ix-corner" data-c="${k}"${extra}>${esc(t)}</span>`;
  const keyRow = keys.length
    ? `<span class="ix-keys">${keys.map((k) => `<span class="ix-key"><i data-mark="${k.mark}"></i>${esc(k.label)}</span>`).join("")}</span>`
    : "";
  const stage = interactive ? ` class="ix-stage" tabindex="0" role="application" aria-roledescription="interactive figure" aria-label="${esc(title)}"` : ` class="ix-stage"`;
  return `<figure class="ix-figure"><div class="ix-card"><div class="ix-corners" aria-hidden="true">${corner("fig", fig)}${corner("title", title)}${hint ? corner("hint", hint) : ""}</div><span class="ix-corner" data-c="readout" data-readout aria-live="polite">${esc(readout)}</span><div${stage}>${body}</div></div>${keyRow || caption ? `<figcaption class="ix-legend">${keyRow}${caption ? `<span>${esc(caption)}</span>` : ""}</figcaption>` : ""}</figure>`;
}

export function pageHtml({ title, body, script = "", theme = "auto", width = 680 }) {
  const themeAttr = theme === "auto" ? "" : ` data-theme="${theme}"`;
  return `<!doctype html><html lang="en"${themeAttr}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}.ix-page{width:min(${width}px,100% - 32px);margin:56px auto 80px}</style></head><body><main class="ix-page">${body}</main>${script ? `<script type="module">${script.replace(/<\/script/gi, "<\\/script")}</script>` : ""}</body></html>`;
}

// ---------- browser runtime (inlined into pages as source) ----------

/** Small helpers the live script needs in the page: the camera, moving parts, motion and gating. */
export function runtimeSource(P) {
  return `
const P = ${JSON.stringify(P)};
const RAD = Math.PI / 180;
const iso = ([x, y, z]) => { const a = P.azimuth * RAD, e = P.elevation * RAD, k = P.scale; return [P.origin[0] + (x * Math.sin(a) - y * Math.cos(a)) * k, P.origin[1] + ((x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e)) * k]; };
const along = (v) => { const [ax, ay] = iso([0, 0, 0]); const [bx, by] = iso(v); return "translate(" + (bx - ax).toFixed(2) + " " + (by - ay).toFixed(2) + ")"; };
const onPlane = (pts, z) => pts.map(([x, y], i) => { const [sx, sy] = iso([x, y, z]); return (i ? "L" : "M") + sx.toFixed(2) + " " + sy.toFixed(2); }).join("");
const follow = (from, to, dt, tau) => to + (from - to) * Math.exp(-dt / tau);
const stillQuery = matchMedia("(prefers-reduced-motion: reduce)");
function loop(stage, tick) {
  let frame = 0, last = 0, visible = false;
  const step = (now) => { const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; const more = tick(dt, stillQuery.matches); frame = visible && more !== false ? requestAnimationFrame(step) : 0; };
  const wake = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(step); } };
  new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) wake(); }, { rootMargin: "120px 0px" }).observe(stage);
  // #t=2.5 runs the figure 2.5 s ahead in fixed steps before the first paint: deterministic shots for review.
  const ahead = Number((location.hash.match(/t=([\\d.]+)/) || [])[1] || 0);
  for (let i = 0; i < Math.round(ahead * 60); i++) tick(1 / 60, false);
  return wake;
}
`;
}

// ---------- style ----------
// Tokens are the only colours. Dark follows the system unless data-theme pins it.

const DARK = `--ix-page:#0b0b0c;--ix-card:#121214;--ix-text:#a3a3a8;--ix-strong:#ececef;--ix-muted:#6c6c72;--ix-line-card:#2c2c31;
--ix-paper:#121214;--ix-top:#1d1d20;--ix-s0:#0e0e10;--ix-s1:#131315;--ix-s2:#17171a;--ix-s3:#1b1b1e;--ix-lit-top:#2a2a2e;--ix-lit-side:#1f1f22;
--ix-hi:#d6d6da;--ix-mid:#6c6c72;--ix-lo:#3d3d42;--ix-faint:#2a2a2e;--ix-lit:#ffffff;--ix-halo:#000000;--ix-halo-a:.85;--ix-dot:#e6e6ea;`;
const LIGHT = `--ix-page:#f1f1ee;--ix-card:#fbfbf9;--ix-text:#55555a;--ix-strong:#18181b;--ix-muted:#8b8b90;--ix-line-card:#d9d9d6;
--ix-paper:#fbfbf9;--ix-top:#ffffff;--ix-s0:#dadad6;--ix-s1:#e3e3e0;--ix-s2:#ebebe8;--ix-s3:#f3f3f0;--ix-lit-top:#ffffff;--ix-lit-side:#ececea;
--ix-hi:#25252a;--ix-mid:#88888e;--ix-lo:#b3b3b8;--ix-faint:#d3d3d5;--ix-lit:#000000;--ix-halo:#7d7d74;--ix-halo-a:.3;--ix-dot:#3a3a3f;`;

export const CSS = `
:root{${DARK}--ix-weight:.6px;--ix-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;color-scheme:dark}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){${LIGHT}color-scheme:light}}
:root[data-theme="light"]{${LIGHT}color-scheme:light}
:root[data-theme="dark"]{${DARK}color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--ix-page);color:var(--ix-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.ix-svg{display:block;width:100%;height:auto;overflow:visible}
.ix-svg path,.ix-svg circle{vector-effect:non-scaling-stroke}
.ix-fill{fill:var(--ix-paper)}
.ix-top{fill:var(--ix-top)}
.ix-shade,.ix-top{stroke-width:.5;stroke-linejoin:round}
.ix-top{stroke:var(--ix-top)}
.ix-shade[data-s="0"]{fill:var(--ix-s0);stroke:var(--ix-s0)}.ix-shade[data-s="1"]{fill:var(--ix-s1);stroke:var(--ix-s1)}.ix-shade[data-s="2"]{fill:var(--ix-s2);stroke:var(--ix-s2)}.ix-shade[data-s="3"]{fill:var(--ix-s3);stroke:var(--ix-s3)}
.ix-solid[data-lit]>.ix-top{fill:var(--ix-lit-top);stroke:var(--ix-lit-top)}
.ix-solid[data-lit]>.ix-shade{fill:var(--ix-lit-side);stroke:var(--ix-lit-side)}
.ix-line{fill:none;stroke:var(--ix-lo);stroke-width:var(--ix-weight);stroke-linecap:round;stroke-linejoin:round}
.ix-line[data-tone="hi"]{stroke:var(--ix-hi)}.ix-line[data-tone="mid"]{stroke:var(--ix-mid)}.ix-line[data-tone="faint"]{stroke:var(--ix-faint)}.ix-line[data-tone="lit"]{stroke:var(--ix-lit)}
.ix-wire-end{fill:var(--ix-paper);stroke:var(--ix-lo);stroke-width:var(--ix-weight)}
.ix-wire-end[data-tone="mid"]{stroke:var(--ix-mid)}.ix-wire-end[data-tone="hi"]{stroke:var(--ix-hi)}
.ix-dots circle{fill:var(--ix-dot);opacity:.32}
.ix-dots[data-tone="hi"] circle{opacity:.85}.ix-dots[data-tone="lo"] circle{opacity:.2}
.ix-face-text{fill:var(--ix-lo);font-family:var(--ix-mono);letter-spacing:.05em}
.ix-face-text[data-tone="mid"]{fill:var(--ix-mid)}
.ix-halo{fill:var(--ix-halo);opacity:var(--ix-halo-a);transform:translateY(3px)}
.ix-figure{margin:0}
.ix-card{position:relative;padding:52px 20px;background:var(--ix-card);box-shadow:0 0 0 1px var(--ix-line-card);--ix-paper:var(--ix-card)}
.ix-stage{outline:none;cursor:pointer;touch-action:manipulation}
.ix-stage:focus-visible{box-shadow:0 0 0 1px var(--ix-mid)}
.ix-corner{position:absolute;color:var(--ix-muted);font:10.5px/1 var(--ix-mono);letter-spacing:.06em;white-space:nowrap}
.ix-corners{position:absolute;inset:18px 20px;pointer-events:none}
.ix-corner[data-c="fig"]{top:0;left:0;color:var(--ix-text)}
.ix-corner[data-c="title"]{top:0;right:0;text-transform:uppercase;letter-spacing:.12em}
.ix-corner[data-c="hint"]{bottom:0;left:0;text-transform:uppercase;letter-spacing:.12em}
.ix-corner[data-c="readout"]{right:20px;bottom:18px;color:var(--ix-text);font-variant-numeric:tabular-nums}
.ix-legend{display:grid;gap:8px;margin-top:12px;color:var(--ix-muted);font-size:13px;line-height:1.55}
.ix-keys{display:flex;flex-wrap:wrap;gap:6px 18px}
.ix-key{display:inline-flex;align-items:center;gap:7px}
.ix-key i{width:14px;height:0;border-top:1px solid var(--ix-mid)}
.ix-key i[data-mark="lit"]{border-color:var(--ix-lit)}
.ix-key i[data-mark="dim"]{border-color:var(--ix-lo)}
@media (max-width:560px){.ix-card{padding:46px 8px 64px}.ix-corner[data-c="hint"]{bottom:22px}.ix-corner[data-c="readout"]{bottom:8px;right:8px}.ix-corners{inset:16px 12px}}
`;
