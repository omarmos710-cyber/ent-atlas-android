/* Build the answer map (www/search/sm_ans.js) for the quick-answer box.

   Every line of every section (paragraph sentence, list item, table row) is labelled with
   the condition it is about and what it answers (treatment, clinical picture, causes ...),
   so a question like "treatment of Bell's palsy" can gather its lines from every article.

   The understanding lives in tools/answers/*.json, written by hand:
     entities: id -> [display name, aliases...]
     articles: route -> {e: default entity, c: {chapter: entity}, s: {section: entity}, a: {section: aspect}}
   Headings that equal or contain an alias are matched automatically, so the files only hold
   the exceptions. Run: node tools/build_answers.js (build_articles.py calls it). */
const fs = require("fs"), path = require("path");
const WWW = path.join(__dirname, "../app/src/main/assets/www/");
const S = require(WWW + "search/xsmart.js");
const { HS, XREF, tidy, fold } = S._x;
const lj = (f, a, b) => { const s = fs.readFileSync(WWW + f, "utf8"); return JSON.parse(s.slice(s.indexOf(a), s.lastIndexOf(b) + 1)) };
const X = lj("search/full.js", "[", "]");
const ASP = S.ASPECTS, AID = ASP.map(a => a.id);

/* curated files */
const ENT = [], EID = new Map(), ART = {}, PAR = {}, APPR = new Set();
const dir = path.join(__dirname, "answers");
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const [id, names] of Object.entries(j.entities || {})) {
    if (EID.has(id)) { const e = ENT[EID.get(id)]; for (const n of names.slice(1)) if (!e.aka.includes(n)) e.aka.push(n); continue }
    EID.set(id, ENT.length); ENT.push({ id, name: names[0], aka: names.slice(1) })
  }
  Object.assign(ART, j.articles || {}); Object.assign(PAR, j.parents || {});
  if (f.startsWith("approach")) for (const r of Object.keys(j.articles || {})) APPR.add(r)
}
let warn = 0;
for (const [r, a] of Object.entries(ART)) for (const v of [a.e, ...Object.values(a.c || {}), ...Object.values(a.s || {})])
  if (v && v !== "-" && !EID.has(v)) { console.log("answer map: unknown entity", v, "in", r); warn++ }

/* alias matching on stemmed tokens */
const ALI = [];
ENT.forEach((e, i) => { for (const a of new Set([e.name, ...e.aka])) { const t = S.toks(a); if (t.length) ALI.push({ i, t, n: t.length }) } });
ALI.sort((a, b) => b.n - a.n);
{ const seen = new Map(); for (const a of ALI) { const k = a.t.slice().sort().join(" "); const o = seen.get(k); if (o !== undefined && o !== a.i) { console.log("answer map: alias", JSON.stringify(k), "is used by", ENT[o].id, "and", ENT[a.i].id); warn++ } else seen.set(k, a.i) } }
function match(text, minCover) {
  const t = S.toks(text); if (!t.length) return -1; const set = new Set(t);
  for (const a of ALI) if (a.t.every(x => set.has(x)) && a.n / t.length >= (minCover || 0)) return a.i;
  return -1
}
/* the condition a sentence is about, when its name opens the sentence */
const VERB = /^(\(|is|are|was|were|has|have|had|may|can|causes?|presents?|gives?|affects?|occurs?|usually|typically|often|tends?|follows?|arises?|responds?|needs?|requires?|starts?|begins?|develops?|accounts?|carries|spreads?|recurs?|resolves?)\b/i;
function subjectOf(t) { const raw = t.replace(/^(the|a|an)\s+/i, ""); const w = S.toks(raw.split(" ").slice(0, 7).join(" ")); for (const a of ALI) { const i = w.indexOf(a.t[0]); if (i >= 0 && i <= 1 && a.t.every((x, j) => w[i + j] === x)) {
  /* find where the name ends in the raw words and check what follows it */
  const words = raw.split(/\s+/); let n = 0, k = 0; for (; k < words.length && n < i + a.n; k++) n += S.toks(words[k]).length;
  if (VERB.test((words[k] || "").replace(/^[^\w(]+/, "")) || /^\(/.test(words[k] || "")) return a.i } } return -1 }
const strip = t => t.replace(/^[\d.]+\s+/, "").trim();
const aspOf = (h, strict) => { const f = fold(h); if (/stage by stage|step by step|\btechnique\b|\bsteps\b|^the operation\b/.test(f)) return "how"; for (const a of ASP) if ((strict ? HS(a) : a.h).test(f)) return a.id; return null };
const NOSUB = new Set(["cf", "dx", "an"]);

const used = new Set(), L = [];
let OPDOC = false;
const add = (doc, k, ent, asp, w) => { if (ent < 0 || !asp) return; if (OPDOC && asp === "tx") w *= .5; const key = doc + "|" + k + "|" + ent + "|" + asp; if (used.has(key)) return; used.add(key); L.push(doc, k, ent, AID.indexOf(asp), Math.round(w * 10)) };
const stats = { secs: 0, ent: 0 };

X.forEach((x, doc) => {
  const [ty, route, title0, where, body] = x; const ar = route.split("~")[0]; OPDOC = ar.startsWith("th:op");
  const [art, ...ch] = where.split(" · "); const chap = strip(ch.join(" · ")), title = strip(title0);
  if (/^for the examination/i.test(chap)) return;
  stats.secs++;
  const A = ART[ar] || {};
  const map = (m, k) => m && Object.prototype.hasOwnProperty.call(m, k) ? (m[k] === "-" ? -2 : EID.get(m[k])) : undefined;
  /* the chapter and the article */
  const chapAsp = (A.a && A.a[chap]) || aspOf(chap, true) || aspOf(chap) || (/^using (it|them) in ent/i.test(chap) ? "tx" : /^(safety|ototoxicity)$/i.test(chap) ? "cx" : /^(at a glance|how (it|they) works?)$/i.test(chap) ? "def" : null);
  let artE = map({ e: A.e }, "e"); if (artE === undefined) artE = match(art, .5);
  let chapE = map(A.c, chap); if (chapE === undefined) chapE = chapAsp ? -1 : match(chap, .6);
  const upper = chapE >= 0 ? chapE : chapE === -2 ? -1 : artE;
  /* the section itself */
  const isEv = ty === "ev";
  const ownTitle = !isEv && !title0.includes(art);
  let secE = ownTitle ? map(A.s, title) : undefined, fromTitle = false;
  if (secE === undefined && ownTitle && !(chapAsp && NOSUB.has(chapAsp))) { const m = match(title, .6); if (m >= 0 && m !== upper) { secE = m; } }
  if (secE !== undefined && secE >= 0 && secE !== upper) fromTitle = true;
  if (secE === undefined || secE === -2) secE = secE === -2 ? -1 : upper;
  if (secE < 0 && upper < 0) return;
  stats.ent++;
  /* a heading that names the aspect outright ("Treatment") counts fully, a looser one ("When it goes wrong") less */
  const curA = A.a && (A.a[title] || A.a["*"]);
  const strictT = ownTitle && !fromTitle ? aspOf(title, true) : null, looseT = ownTitle && !fromTitle && !strictT ? aspOf(title) : null;
  const titleAsp = curA || strictT || looseT, titleW = curA || strictT ? 1 : .75;
  /* "Management > Bell's palsy": the chapter's aspect also holds for the condition the section names;
     "Peripheral causes > Vestibular neuritis" is a whole account of that condition, not its causes */
  const CARRY = new Set(["tx", "cx", "px", "ind", "how"]);
  const secAsp = isEv ? (chapAsp === "tx" || chapAsp === "px" ? chapAsp : null) : (titleAsp || (fromTitle && !CARRY.has(chapAsp) ? null : chapAsp));
  const secW = titleAsp ? titleW : .9;
  const defSec = /\b(definitions?|overview|what it is|introduction)\b/i.test(title) && !fromTitle;
  const U = S._units(body);
  let subj = -1, line = -1, first = true;
  U.forEach(u => {
    const t = tidy(u.t); if (u.line !== line) { subj = -1; line = u.line }
    const ok = t.length >= 25 && t.length <= 420 && !/\?$/.test(t) && !XREF.test(t);
    /* a sentence that starts with another condition's name is about that condition ("Hashimoto thyroiditis is treated ...") */
    if (!u.row) { const m = subjectOf(t); if (m >= 0 && m !== secE) subj = m; else if (!S._x.PRON.test(t)) subj = -1 }
    if (!ok || (!u.row && !/[.!?;)]$/.test(t) && t.split(" ").length <= 6)) return;
    const lab = u.label ? aspOf(u.label) : null;
    const cues = {}; for (const a of ASP) { const n = (fold(t).match(new RegExp((a.cx || a.c).source, "g")) || []).length; if (n) cues[a.id] = n }
    const labelE = u.label ? match(u.label, .6) : -1;
    const E = labelE >= 0 && !u.row ? labelE : secE;
    const put = (ent, f, subjectLine) => {
      if (secAsp) add(doc, u.k, ent, secAsp, secW * f);
      if (lab) add(doc, u.k, ent, lab, 1 * f);
      /* cue words count for more in a sentence that is itself about the condition ("Hashimoto thyroiditis ... is treated with thyroxine") */
      for (const [a, n] of Object.entries(cues)) if (a !== secAsp) add(doc, u.k, ent, a, subjectLine ? Math.min(.75, .6 + .1 * n) : Math.min(.7, .35 + .15 * n) * (secAsp ? .6 : 1) * f);
      if ((defSec || (fromTitle && first)) && !u.row) add(doc, u.k, ent, "def", .8 * f);
    };
    put(E, 1);
    if (E !== secE && secE >= 0) put(secE, .8);
    if (fromTitle && upper >= 0 && chapAsp) add(doc, u.k, upper, chapAsp, .8);
    if (subj >= 0 && subj !== E) put(subj, .9, true);
    first = false
  })
});

let fp = 0; for (const x of X) fp += x[4].length;
/* each condition's own article: a clinical article that is about it, else one with a chapter or section on it, else an operation or drug page */
const home = ENT.map(() => ""); const arts = Object.entries(ART), clin = ([r]) => r.startsWith("cl:t-") && !r.startsWith("cl:t-dr_") && !r.startsWith("cl:t-im_") && !APPR.has(r);
for (const pass of [[clin, "e"], [clin, "cs"], [([r]) => APPR.has(r), "e"], [([r]) => APPR.has(r), "cs"], [() => true, "e"], [() => true, "cs"]]) for (const [r, a] of arts.filter(pass[0])) {
  const vals = pass[1] === "e" ? [a.e] : [...Object.values(a.c || {}), ...Object.values(a.s || {})];
  for (const v of vals) if (v && EID.has(v) && !home[EID.get(v)]) home[EID.get(v)] = r }
for (const [c, p] of Object.entries(PAR)) if (!EID.has(c) || !EID.has(p)) { console.log("answer map: unknown parent pair", c, p); warn++ }
const out = { fp: X.length + ":" + fp, asp: AID, e: ENT.map(e => [e.name, ...e.aka]), id: ENT.map(e => e.id), h: home, p: ENT.map(e => PAR[e.id] && EID.has(PAR[e.id]) ? EID.get(PAR[e.id]) : -1), l: L };
fs.writeFileSync(WWW + "search/sm_ans.js", "window.XSMA=" + JSON.stringify(out) + ";\n");
console.log(`answer map: ${ENT.length} conditions, ${L.length / 5} labels over ${stats.ent}/${stats.secs} sections, ${Math.round(fs.statSync(WWW + "search/sm_ans.js").size / 1024)} KB${warn ? `, ${warn} WARNINGS` : ""}`);
