// Screenshot a built page in headless Chrome and surface console errors. No npm dependencies.
// node scripts/shoot.mjs page.html [--out shots/name.png] [--width 760] [--height 900] [--scale 2] [--wait 1500] [--zoom 4 --at x,y]
// --hash t=2.5 fast-forwards a kit page 2.5 s before the shot.
// --zoom crops a close-up around --at (CSS px of the page) by scaling the device, for 4x checks.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"));
if (!page) {
  console.error("usage: node scripts/shoot.mjs page.html [--out file.png] [--width 760] [--wait 1500] [--zoom 4 --at x,y]");
  process.exit(2);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const width = Number(opt("width", 760));
const height = Number(opt("height", 900));
const scale = Number(opt("scale", 2));
const wait = Number(opt("wait", 1500));
const zoom = Number(opt("zoom", 0));
const out = resolve(opt("out", join(dirname(page), "shots", basename(page, ".html") + (zoom ? `-x${zoom}` : `-${width}`) + ".png")));
mkdirSync(dirname(out), { recursive: true });

const CHROME = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error("Chrome not found. Set CHROME=/path/to/chrome.");
  process.exit(2);
}

let url = pathToFileURL(resolve(page)).href + (opt("hash", "") ? `#${opt("hash", "")}` : "");
let size = `${width},${height}`;
let factor = scale;
if (zoom) {
  // A wrapper page frames one region of the figure at zoom x, so the close-up is real vector detail.
  const [ax, ay] = String(opt("at", "380,300")).split(",").map(Number);
  const frame = 360;
  const wrap = join(mkdtempSync(join(tmpdir(), "ix-shoot-")), "zoom.html");
  writeFileSync(
    wrap,
    `<!doctype html><style>html,body{margin:0;overflow:hidden;background:#000}iframe{border:0;width:${width}px;height:${height}px;transform-origin:0 0;transform:scale(${zoom}) translate(${-(ax - frame / zoom / 2)}px,${-(ay - frame / zoom / 2)}px)}</style><iframe src="${url}"></iframe>`,
  );
  url = pathToFileURL(wrap).href;
  size = `${frame},${frame}`;
  factor = 2;
}

if (!zoom && width < 500) {
  // Headless Chrome will not open a window narrower than 500 px, so a phone width is framed in an iframe.
  const wrap = join(mkdtempSync(join(tmpdir(), "ix-shoot-")), "narrow.html");
  writeFileSync(wrap, `<!doctype html><style>html,body{margin:0;overflow:hidden;background:#808080}iframe{border:0;display:block;width:${width}px;height:${height}px}</style><iframe src="${url}"></iframe>`);
  url = pathToFileURL(wrap).href;
  size = `500,${height}`;
}

const run = spawnSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu-sandbox",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--enable-logging=stderr",
    "--v=0",
    `--window-size=${size}`,
    `--force-device-scale-factor=${factor}`,
    `--virtual-time-budget=${wait}`,
    `--screenshot=${out}`,
    url,
  ],
  { encoding: "utf8", timeout: 60000 },
);
const log = `${run.stdout}\n${run.stderr}`;
const problems = log.split("\n").filter((line) => /CONSOLE|Uncaught|SyntaxError|TypeError|ReferenceError/.test(line) && !/DevTools|GPU|gpu/.test(line));
if (problems.length) {
  console.log("console:");
  for (const line of problems) console.log("  " + line.trim());
}
if (!existsSync(out)) {
  console.error("no screenshot written");
  process.exit(1);
}
console.log("shot", out);
process.exit(problems.some((l) => /error|Uncaught/i.test(l)) ? 1 : 0);
