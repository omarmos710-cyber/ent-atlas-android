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
/* the sections in the order the app gives them to the smart search: articles, the question bank, then the anatomy atlas and imaging cases */
const X = lj("search/full.js", "[", "]").concat(lj("search/sm_q.js", "[", "]"), fs.existsSync(WWW + "search/sm_atlas.js") ? lj("search/sm_atlas.js", "[", "]") : []);
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
/* AMBOSS-layout articles: every "# Name {dz}" chapter is a condition. Chapters whose name is not yet a
   curated condition become one automatically (child of the article's condition), so "treatment of Eagle
   syndrome" finds the Management section of that chapter. */
const CLIN = path.join(__dirname, "../content/clinic"), DZ = {};
for (const f of fs.readdirSync(CLIN).filter(f => f.endsWith(".txt"))) {
  const id = f.slice(0, -4), txt = fs.readFileSync(path.join(CLIN, f), "utf8");
  if (!/^@layout amboss/m.test(txt)) continue;
  DZ["cl:t-" + id] = [...txt.matchAll(/^# (.+?) \{dz\}/gm)].map(m => m[1].trim());
}
/* imaging cases ("cond:<id>"): every line answers imaging (investigation) of the condition the case is about */
for (const x of X) if (x[0] === "cond") { const r = x[1].split("~")[0]; if (!ART[r]) ART[r] = { a: { "*": "dx" }, auto: x[2] } }
let warn = 0;
for (const [r, a] of Object.entries(ART)) for (const v of [a.e, ...Object.values(a.c || {}), ...Object.values(a.s || {})])
  if (v && v !== "-" && !EID.has(v)) { console.log("answer map: unknown entity", v, "in", r); warn++ }

/* alias matching on stemmed tokens */
let ALI = [];
const mkAli = () => { ALI = []; ENT.forEach((e, i) => { for (const a of new Set([e.name, ...e.aka])) { const t = S.toks(a); if (t.length) ALI.push({ i, t, n: t.length }) } }); ALI.sort((a, b) => b.n - a.n) };
mkAli();
{ const GEN = /^(other|the|more|rare|blood disorders|systemic|non-?odontogenic|bone tumours and|ossifying fibroma and)\b/i;
  const exact = t => { const k = S.toks(t).slice().sort().join(" "); return ALI.find(a => a.t.slice().sort().join(" ") === k) };
  let made = 0; const TAKEN = new Set(), ATITLE = {};
  for (const x of X) { const r = x[1].split("~")[0]; if (!ATITLE[r]) ATITLE[r] = x[3].split(" · ")[0] }
  for (const [r, chs] of Object.entries(DZ)) {
    const A = ART[r] || (ART[r] = {}); A.c = A.c || {};
    for (const ch of chs) {
      if (Object.prototype.hasOwnProperty.call(A.c, ch)) continue;
      /* a curated section name that is now a disease chapter ("Tuberculosis" in chronic laryngitis) */
      if (A.s && Object.prototype.hasOwnProperty.call(A.s, ch)) { A.c[ch] = A.s[ch]; continue }
      const m = exact(ch); if (m) { A.c[ch] = ENT[m.i].id; continue }
      if (GEN.test(ch)) continue;
      const base = ch.replace(/\s*\([^)]*\)/g, "").trim(), inner = [...ch.matchAll(/\(([^)]*)\)/g)].map(x => x[1]).filter(x => x.split(" ").length <= 4 && !/^(with|and|or|the|in|of)\b/i.test(x));
      const tail = base.split(" ").pop();
      const names = [ch, base, ...inner.map(x => /^[A-Z0-9-]{3,}$/.test(x) ? x : /\b(syndrome|disease|carcinoma|tumou?rs?|cysts?|thyroiditis|palsy|fracture|abscess|carcinoma)$/i.test(base) && !/\b(syndrome|disease|carcinoma|tumou?r|cyst)\b/i.test(x) ? x + " " + tail : x.split(" ").length >= 2 ? x : null)];
      let aka = [...new Set(names.filter(n => n && n !== ch && !exact(n) && S.toks(n).length))], name = ch;
      /* the same chapter name in two articles ("Benign tumours"): name it by its article, with no loose aliases */
      if (TAKEN.has(S.toks(ch).slice().sort().join(" "))) { name = ch + " (" + (ATITLE[r] || r) + ")"; aka = [] }
      TAKEN.add(S.toks(ch).slice().sort().join(" ")); aka.forEach(n => TAKEN.add(S.toks(n).slice().sort().join(" ")));
      const id = "dz_" + r.slice(5) + "_" + (++made);
      EID.set(id, ENT.length); ENT.push({ id, name, aka });
      A.c[ch] = id; if (A.e && A.e !== "-" && !PAR[id]) PAR[id] = A.e;
    }
  }
  mkAli(); console.log("answer map: " + made + " conditions added from disease chapters") }
/* imaging cases: the condition their title names, or a new one named by the title */
{ let made = 0;
  for (const [r, A] of Object.entries(ART)) { if (!A.auto) continue;
    const t = A.auto, base = t.replace(/\s*\([^)]*\)/g, "").replace(/,.*$/, "").trim();
    const m = match(base, .6); if (m >= 0) { A.e = ENT[m].id; continue }
    const id = "ic_" + (++made); EID.set(id, ENT.length);
    const aka = [...new Set([t, base].map(x => x.toLowerCase()).filter(x => S.toks(x).length && match(x, .99) < 0))];
    ENT.push({ id, name: t, aka }); A.e = id; mkAli() }
  console.log("answer map: " + made + " conditions added from imaging cases") }
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
const AMB = [[/^summary\b/, "def"], [/\bdifferential\b/, "ddx"], [/^contra-?indications?\b/, "ci"], [/^(etiology|aetiology|pathophysiology|pathology|pathogenesis)\b/, "why"], [/^subtypes?\b/, "cls"], [/^prognosis\b/, "px"], [/^complications?\b/, "cx"], [/^management\b/, "tx"], [/^diagnosis\b/, "dx"], [/^clinical features\b/, "cf"], [/^applied anatomy\b/, "an"]];
const aspOf = (h, strict) => { const f = fold(h); if (/stage by stage|step by step|\btechnique\b|\bsteps\b|^the operation\b/.test(f)) return "how"; for (const [re, a] of AMB) if (re.test(f)) return a; for (const a of ASP) if ((strict ? HS(a) : a.h).test(f)) return a.id; return null };
/* "Etiology and clinical features", "Diagnosis and management": every aspect a compound heading names */
const aspsOf = h => { const f = fold(h); const parts = f.split(/\s+and\s+|,\s*|:\s*/).map(x => x.trim().replace(/^the\s+/, "")).filter(Boolean); if (parts.length < 2) return []; return [...new Set(parts.map(x => aspOf(x, true)).filter(Boolean))] };
const NOSUB = new Set(["cf", "dx", "an"]);
const ANATF = new Set(["nerve", "blood", "lymph", "bound", "cont", "rel", "musc", "parts", "branch", "course", "dev"]);
/* rows of a summary table name what they answer: "Adult dose", "Avoid", "Pregnancy", "Position" */
const ROWA = [[/^(adult |child |children's |maximum |usual |paediatric )?doses?\b|^dosage|^duration|^regimen/i, "dose"], [/^(avoid|contra-?indications?|cautions?)\b/i, "ci"], [/^pregnan|^breast/i, "preg"], [/^(how it works|mechanism)/i, "mech"], [/^spectrum/i, "spec"], [/^(ent uses|uses|indications?)\b/i, "ind"], [/^class\b/i, "def"], [/^(adverse|side effects|safety|toxicity)/i, "se"], [/^interactions?/i, "int"], [/^anaesthe|^anesthe/i, "anaes"], [/^position/i, "pos"], [/^(tray|before the|work-?up|antibiotics|monitoring|equipment|instruments)/i, "prep"], [/^(after|post-?op|aftercare|follow)/i, "post"], [/^complications?/i, "cx"], [/^imaging/i, "dx"]];
const STRONG = [["tx", /\b(is|are) (best )?(treated|managed)\b|\b(treatment|management) is\b|\btreated (with|by)\b|\bfirst[- ]line\b|\bdrug of choice\b/i],
  ["ci", /\bcontra-?indicat/i], ["cf", /\bpresents? (with|as)\b|\bpresenting (with|as)\b|\bthe (classic|cardinal) (sign|symptom|feature)/i],
  ["dx", /\b(is )?(diagnosed|confirmed) (by|with|on)\b|\binvestigation of choice\b|\bgold standard\b/i],
  ["why", /\b(is|are) caused by\b|\bresults? from\b|\bthe commonest cause\b|\bmost common cause\b/i],
  ["cx", /\bcomplications? (include|are)\b/i], ["px", /\b(five|ten|5|10)-year survival\b|\bprognosis is\b|\bmedian survival\b|\bmost lethal\b|\b(poor|good|excellent) (prognosis|outlook)\b|\bthe outlook is\b|\bcured in\b/i]];

const used = new Set(), L = [];
let OPDOC = false;
const add = (doc, k, ent, asp, w) => { if (ent < 0 || !asp) return; if (OPDOC && asp === "tx") w *= .5; const key = doc + "|" + k + "|" + ent + "|" + asp; if (used.has(key)) return; used.add(key); L.push(doc, k, ent, AID.indexOf(asp), Math.round(w * 10)) };
const stats = { secs: 0, ent: 0 };

X.forEach((x, doc) => {
  const [ty, route, title0, where, body] = x; if (ty === "q" || ty === "card" || ty === "viva") return;
  const ar = route.split("~")[0]; OPDOC = ar.startsWith("th:op");
  const [art, ...ch] = where.split(" · "); const chap = strip(ch.join(" · ")), title = strip(title0);
  if (/^(for the examination|sources|tips and links)\b/i.test(chap)) return;
  stats.secs++;
  const A = ART[ar] || {};
  const map = (m, k) => m && Object.prototype.hasOwnProperty.call(m, k) ? (m[k] === "-" ? -2 : EID.get(m[k])) : undefined;
  /* the chapter and the article */
  const chapAsp = (A.a && A.a[chap]) || aspOf(chap, true) || aspOf(chap) || (/^using (it|them) in ent/i.test(chap) ? "tx" : /^(safety|ototoxicity)$/i.test(chap) ? "cx" : /^(at a glance|how (it|they) works?)$/i.test(chap) ? "def" : null);
  let artE = map({ e: A.e }, "e"); if (artE === undefined) artE = match(art, .5);
  /* an operation's chapters ("Operating note", "Consent") are parts of the operation, never other conditions */
  let chapE = map(A.c, chap); if (chapE === undefined) chapE = chapAsp || ar.startsWith("th:") ? -1 : match(chap, .6);
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
  const defSec = (/\b(definitions?|overview|what it is|introduction)\b/i.test(title) || /^summary$/i.test(chap)) && !fromTitle;
  const extraA = ownTitle && !fromTitle ? aspsOf(title).filter(a => a !== secAsp) : [];
  /* a section on one part of the anatomy ("Nerve supply", "Boundaries") also answers "anatomy of X" */
  if (ANATF.has(secAsp) || extraA.some(a => ANATF.has(a))) extraA.push("an");
  const U = S._units(body);
  let subj = -1, line = -1, first = true;
  U.forEach(u => {
    const t = tidy(u.t); if (u.line !== line) { subj = -1; line = u.line }
    const ok = t.length >= 25 && t.length <= (u.row ? 1000 : 420) && !/\?$/.test(t) && !XREF.test(t);
    /* a sentence that starts with another condition's name is about that condition ("Hashimoto thyroiditis is treated ...") */
    if (!u.row) { const m = subjectOf(t); if (m >= 0 && m !== secE) subj = m; else if (!S._x.PRON.test(t)) subj = -1 }
    if (!ok || (!u.row && !/[.!?;)]$/.test(t) && t.split(" ").length <= 6)) return;
    /* the on-call summary at the head of Diagnosis or Management repeats the prose below it in note form: it counts, but less */
    const ward = /^approach$/i.test(strip(u.label || ""));
    const lab = u.label && !ward ? aspOf(u.label) : null;
    /* a line that opens with what it lists ("Five parts: squamous, petrous ...", "Branches: ...", "Steroids: ...") answers that */
    const lead = !u.row && /^[^:]{3,40}:\s/.test(t) ? t.split(":")[0] : "", leadA = lead && lead.split(" ").length <= 5 ? aspOf(lead, true) : null;
    const rowA = u.rowLabel ? (ROWA.find(([re]) => re.test(u.rowLabel)) || [])[1] || aspOf(u.rowLabel, true) : null;
    const cues = {}; for (const a of ASP) { const n = (fold(t).match(new RegExp((a.cx || a.c).source, "g")) || []).length; if (n) cues[a.id] = n }
    const labelE = u.label ? match(u.label, .6) : -1;
    const E = labelE >= 0 && !u.row ? labelE : secE;
    const put = (ent, f, subjectLine) => {
      if (secAsp) add(doc, u.k, ent, secAsp, secW * f);
      for (const a of extraA) add(doc, u.k, ent, a, .85 * f);
      /* a sentence that says outright what it is ("It is treated with thyroxine", "Contraindications are ...") */
      for (const [a, re] of STRONG) if (a !== secAsp && re.test(t) && !(u.row && /^(dx|tx)$/.test(secAsp) && /^(dx|tx)$/.test(a))) add(doc, u.k, ent, a, .85 * f); /* a table row keeps its section: "first line" in an investigations table is a test, not a drug */
      if (lab) add(doc, u.k, ent, lab, 1 * f);
      if (rowA) add(doc, u.k, ent, rowA, 1 * f);
      if (leadA) add(doc, u.k, ent, leadA, .95 * f);
      /* a table row that gives an amount answers "dose" ("Ondansetron: adult 4 mg intravenously ...") */
      if (u.row && rowA !== "dose" && /\b\d+(\.\d+)? ?(mg|g|micrograms?|ml|units)(\/kg)?\b/i.test(t)) add(doc, u.k, ent, "dose", .9 * f);
      /* cue words count for more in a sentence that is itself about the condition ("Hashimoto thyroiditis ... is treated with thyroxine") */
      for (const [a, n] of Object.entries(cues)) if (a !== secAsp) add(doc, u.k, ent, a, subjectLine ? Math.min(.75, .6 + .1 * n) : Math.min(.7, .35 + .15 * n) * (secAsp ? .6 : 1) * f);
      if ((defSec || (fromTitle && first)) && !u.row) add(doc, u.k, ent, "def", .8 * f);
    };
    const wf = ward ? .8 : 1;
    put(E, wf);
    if (E !== secE && secE >= 0) put(secE, .8 * wf);
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
