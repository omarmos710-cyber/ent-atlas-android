/* Build search/sm_atlas.js: the anatomy atlas notes, anatomy tables and imaging cases as smart-search sections,
   in the same format as search/full.js ([type, route, title, where, text]), so the smart search and the
   quick-answer box can read them like the articles.

   The data lives in index.html (REGIONS, TABLES, CONDS). It is read here in a sandbox: only the data
   definitions run, nothing on screen.
     note  "region:<region>~<section id>"   one anatomy note section (its points, then its clinical note)
     tab   "region:<region>~tb-<table id>"  one anatomy table
     cond  "cond:<case id>"                 one imaging case (findings, points to note, differential)
   Run: node tools/build_atlas.js (build_articles.py calls it before the smart model). */
const fs = require("fs"), path = require("path"), vm = require("vm");
const WWW = path.join(__dirname, "../app/src/main/assets/www/");
const H = fs.readFileSync(WWW + "index.html", "utf8");
const s = H.indexOf("<script>") + 8, e = H.indexOf("</script>", s);
const any = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : any, apply: () => any, construct: () => any, set: () => true });
const ctx = { console: { log() {}, warn() {}, error() {} }, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {}, requestAnimationFrame: () => 0,
  matchMedia: () => ({ matches: false, addEventListener() {} }), localStorage: { getItem: () => null, setItem() {} }, navigator: {}, location: { href: "", hash: "", search: "" },
  history: any, document: any, addEventListener() {}, innerHeight: 800, innerWidth: 400, getComputedStyle: () => any, ResizeObserver: function () { return any },
  IntersectionObserver: function () { return any }, MutationObserver: function () { return any }, performance: { now: () => 0 }, Image: function () { return any }, fetch: () => new Promise(() => {}) };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
try { vm.runInContext(H.slice(s, e), ctx, { timeout: 30000 }) } catch (x) { /* the screen code stops the script; the data is already defined */ }
const get = n => { try { return vm.runInContext(n, ctx) } catch (x) { return undefined } };
const REGIONS = get("REGIONS"), TABLES = get("TABLES") || [], CONDS = get("CONDS") || [];
if (!REGIONS || !REGIONS.length) { console.error("atlas: could not read REGIONS from index.html"); process.exit(1) }

const clean = t => String(t == null ? "" : t).replace(/<[^>]+>/g, " ").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const cell = t => clean(t).replace(/\t/g, " ");
const RN = {}; for (const r of REGIONS) RN[r.id] = r.name;
const out = [];
for (const r of REGIONS) for (const sc of r.sections || []) {
  const pts = (sc.p || []).map(clean).filter(Boolean); if (!pts.length) continue;
  const body = [clean(sc.t), ...pts]; if (sc.k) body.push("Clinical note", clean(sc.k));
  out.push(["note", "region:" + r.id + "~" + sc.id, clean(sc.t), r.name + " · Anatomy atlas", body.join("\n")]);
}
for (const t of TABLES) {
  const reg = (t.regions || [])[0]; if (!reg || !(t.rows || []).length) continue;
  /* header cells end in a double tab, body cells in a tab, as in search/full.js */
  const lines = [clean(t.title), (t.head || []).map((h, i) => cell(h) || (i ? "" : "·")).join("\t\t"), ...t.rows.map(row => row.map(cell).join("\t"))];
  if (t.note) lines.push(clean(t.note));
  out.push(["tab", "region:" + reg + "~tb-" + t.id, clean(t.title), (t.regions || []).map(x => RN[x] || x).join(", ") + " · Anatomy table", lines.join("\n")]);
}
for (const c of CONDS) {
  const body = [clean(c.t)];
  const pts = (c.pts || []).map(clean).filter(Boolean), paras = (c.paras || []).map(clean).filter(Boolean);
  if (paras.length) body.push("Findings", ...paras);
  if (pts.length) body.push("Points to note", ...pts);
  if (c.ddx) body.push("Differential diagnosis", clean(c.ddx));
  const figs = (c.figs || []).map(f => clean(f.t)).filter(x => x.length > 20);
  if (figs.length) body.push("On the images", ...figs);
  out.push(["cond", "cond:" + c.id, clean(c.t), "Imaging case · " + clean(c.t), body.join("\n")]);
}
fs.writeFileSync(WWW + "search/sm_atlas.js", "window.XSMATL=" + JSON.stringify(out) + ";\n");
const n = k => out.filter(x => x[0] === k).length;
console.log(`atlas: ${n("note")} anatomy notes, ${n("tab")} tables, ${n("cond")} imaging cases, ${Math.round(fs.statSync(WWW + "search/sm_atlas.js").size / 1024)} KB`);
