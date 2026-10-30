// Static checks on a built figure page. Exits 1 on any failure.
// node scripts/check.mjs page.html
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/check.mjs page.html");
  process.exit(2);
}
const html = readFileSync(file, "utf8");
const svg = (html.match(/<svg class="ix-svg"[\s\S]*?<\/svg>/) || [""])[0];
const script = (html.match(/<script type="module">([\s\S]*?)<\/script>/) || ["", ""])[1];
const results = [];
const check = (ok, name, detail = "") => results.push({ ok, name, detail });

check(Boolean(svg), "figure svg present");
check(/role="img"/.test(svg) && /aria-label="[^"]{40,}"/.test(svg), "svg has role=img and a real aria-label (40+ chars)");
const colours = svg.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) || [];
check(colours.length === 0, "drawing uses tokens only, no literal colours", colours.slice(0, 5).join(" "));
const texts = (svg.match(/<text/g) || []).length;
check(texts <= 1, "at most one engraved label inside the drawing", `${texts} <text>`);
const lit = (svg.match(/data-lit/g) || []).length;
check(lit >= 1, "one accent part is lit", `${lit} lit solids`);
check(/data-c="fig"/.test(html) && /data-c="title"/.test(html), "card has Fig n and a title");
check(/data-readout/.test(html), "card has a live readout");
check(/data-c="hint"/.test(html) || !script, "interactive card has a hint");
check(/<figcaption/.test(html), "a true caption sits under the card");
if (script) {
  check(/prefers-reduced-motion/.test(script), "motion respects prefers-reduced-motion");
  check(/IntersectionObserver/.test(script), "animation stops offscreen");
  check(/keydown/.test(script), "figure answers the keyboard");
  check(!/setInterval\(/.test(script), "no setInterval loops (use the rAF loop)");
}
check(/prefers-color-scheme:light/.test(html) && /data-theme="light"/.test(html), "both themes are defined");
const paths = (svg.match(/<path/g) || []).length;
const solids = (svg.match(/class="ix-solid"/g) || []).length;
check(solids >= 40, "dense enough: 40+ solids", `${solids} solids, ${paths} paths`);

for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `${failed} check(s) failed` : "check passed");
process.exit(failed ? 1 : 0);
