#!/usr/bin/env node
/* Tests for syncing progress between devices.
   Loads the real code between SYNC-CORE-BEGIN and SYNC-CORE-END in index.html (plus the S0 defaults) and plays
   out two-device situations: deletions, edits after deletions, restores, old data, clock differences, bad data.
   Run: node tools/test_sync.js   (exit code 1 if anything fails) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/www/index.html"), "utf8");
const s0 = /let S0=\{[^;]*\};/.exec(html);
const core = /\/\*SYNC-CORE-BEGIN[\s\S]*?\/\*SYNC-CORE-END\*\//.exec(html);
if (!s0 || !core) { console.error("sync code not found in index.html"); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(s0[0] + "\n" + core[0] + "\nthis.api={S0,stClean,snapOf,syncDiff,mergeSt,pruneMod,syncWith,syncCycle,modIn};", ctx);
const { S0, stClean, snapOf, syncDiff, mergeSt, syncCycle } = ctx.api;

let pass = 0, fail = 0;
const J = x => JSON.stringify(x);
function ok(name, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? "  → " + detail : "")); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const DAY = 864e5, T0 = Date.UTC(2026, 10, 21);

/* The cloud: one row holding {json,t}, with an "updated at" stamp used for conditional writes, like the real table. */
function cloudRow() {
  const c = { row: null, n: 0, writes: 0 };
  c.read = async () => c.row && clone(c.row);
  c.write = async (data, prevAt) => {
    if ((c.row ? c.row.updated_at : null) !== prevAt) return false;      // someone else wrote first
    c.row = { data: clone(data), updated_at: "u" + (++c.n) }; c.writes++; return true;
  };
  c.st = () => c.row && JSON.parse(c.row.data.json);
  return c;
}
/* A device: holds progress, a snapshot from its last save, and a clock. Saves and syncs through the shipped code. */
function device(start) {
  const d = { st: stClean(clone(start || {})), now: T0 };
  d.prev = snapOf(d.st);
  d.save = () => { d.prev = syncDiff(d.prev, d.st, d.now); d.st.t = d.now; };
  d.tick = ms => { d.now += ms || 1000; };
  /* the same steps as sbSync's apply(): keep the merged copy, merge again if this device changed meanwhile */
  d.io = cloud => ({ row: () => cloud.read(), write: (v, at) => cloud.write(v, at), local: () => d.st,
    apply: (M, before) => { const now = JSON.stringify(d.st); const next = now === before ? M : mergeSt(d.st, M, d.now);
      if (now !== before) next.t = Math.max(d.st.t || 0, M.t || 0); d.st = next; d.prev = snapOf(d.st); } });
  d.sync = async cloud => { await syncCycle(d.io(cloud), () => d.now); };
  return d;
}
/* two devices that start from the same synced progress */
async function pair(start) {
  const cloud = cloudRow();
  const A = device(start); A.save(); await A.sync(cloud);
  const B = device(); await B.sync(cloud);
  return { A, B, cloud };
}

console.log("Sync tests");
(async () => {

{ // 1. a deletion on one device is not undone by the other
  const { A, B, cloud } = await pair({ stars: { a: 1, b: 1 }, notes: { a: "old" }, read: { x: 1 }, miss: { q: { q1: 1, q2: 1 } } });
  A.tick(); delete A.st.stars.a; delete A.st.notes.a; delete A.st.read.x; delete A.st.miss.q.q1; A.save();
  B.tick(500); B.st.stars.c = 1; B.save(); await B.sync(cloud);              // B (stale) syncs first
  await A.sync(cloud); B.tick(5000); await B.sync(cloud);
  ok("deletion wins over the other device's older copy", J(A.st.stars) === J({ b: 1, c: 1 }) && !A.st.notes.a && !A.st.read.x && J(A.st.miss.q) === J({ q2: 1 }), J([A.st.stars, A.st.notes, A.st.read, A.st.miss]));
  ok("the other device receives the deletion", J(B.st.stars) === J({ b: 1, c: 1 }) && !B.st.notes.a && !B.st.read.x, J([B.st.stars, B.st.notes]));
}

{ // 2. an edit made after a deletion (on the other, not yet synced, device) is kept
  const { A, B, cloud } = await pair({ notes: { a: "old" }, miss: { q: { q1: 1 } } });
  A.tick(1000); delete A.st.notes.a; delete A.st.miss.q.q1; A.save();
  B.tick(2000); B.st.notes.a = "new note"; B.st.miss.q.q1 = 2; B.save();
  await A.sync(cloud); await B.sync(cloud); await A.sync(cloud);
  ok("newer edit survives an older deletion (note)", A.st.notes.a === "new note" && B.st.notes.a === "new note", J([A.st.notes, B.st.notes]));
  ok("newer edit survives an older deletion (mistake)", A.st.miss.q.q1 === 2 && B.st.miss.q.q1 === 2, J([A.st.miss, B.st.miss]));
}

{ // 2b. the device that saved last overall made the OLDER change to the item
  const { A, B, cloud } = await pair({ notes: { a: "old" } });
  A.tick(1000); delete A.st.notes.a; A.save();
  B.tick(2000); B.st.notes.a = "new note"; B.save();
  A.tick(5000); A.st.stars.z = 1; A.save();
  await B.sync(cloud); await A.sync(cloud); await B.sync(cloud);
  ok("an item's own change time beats the copy's save time", A.st.notes.a === "new note" && B.st.notes.a === "new note" && A.st.stars.z === 1, J([A.st.notes, B.st.notes]));
}

{ // 3. deleting then adding back sticks
  const { A, B, cloud } = await pair({ stars: { a: 1 } });
  A.tick(); delete A.st.stars.a; A.save(); await A.sync(cloud); await B.sync(cloud);
  B.tick(5000); B.st.stars.a = 1; B.save(); await B.sync(cloud); await A.sync(cloud);
  ok("re-added item survives the earlier deletion", A.st.stars.a === 1 && B.st.stars.a === 1, J([A.st.stars, B.st.stars]));
}

{ // 4. different items added on each device are both kept — also inside a section that is new on both
  const { A, B, cloud } = await pair({ miss: { q: {} }, th: { log: {} } });
  A.tick(); A.st.miss.q.a = 1; A.st.stars.x = 1; A.st.th.q = { x: 1 }; A.save();
  B.tick(); B.st.miss.q.b = 1; B.st.stars.y = 1; B.st.th.q = { y: 1 }; B.save();
  await A.sync(cloud); await B.sync(cloud); await A.sync(cloud);
  ok("additions from both devices are kept", J(A.st.miss.q) === J(B.st.miss.q) && A.st.miss.q.a && A.st.miss.q.b && A.st.stars.x && A.st.stars.y, J([A.st.miss.q, A.st.stars]));
  ok("items added to a brand-new section on both devices are both kept", A.st.th.q.x === 1 && A.st.th.q.y === 1 && J(B.st.th) === J(A.st.th), J([A.st.th, B.st.th]));
}

{ // 5. each flashcard keeps its own latest review, whichever device saved last overall
  const { A, B, cloud } = await pair({ cards: { c1: { b: 0, d: 1 }, c2: { b: 0, d: 1 } } });
  A.tick(1000); A.st.cards.c1 = { b: 2, d: 500 }; A.save();
  B.tick(2000); B.st.cards.c2 = { b: 3, d: 900 }; B.save();
  B.tick(3000); B.st.stars.z = 1; B.save();
  await B.sync(cloud); await A.sync(cloud); await B.sync(cloud);
  const strip = c => { const r = {}; for (const k in c) r[k] = { b: c[k].b, d: c[k].d }; return r; };
  ok("both reviews kept (per-card)", J(strip(A.st.cards)) === J({ c1: { b: 2, d: 500 }, c2: { b: 3, d: 900 } }) && J(B.st.cards) === J(A.st.cards), J([A.st.cards, B.st.cards]));
  A.tick(10000); A.st.cards.c2 = { b: 4, d: 2000 }; A.save(); await A.sync(cloud); await B.sync(cloud);
  ok("the later review of the same card wins", B.st.cards.c2.b === 4, J(B.st.cards));
  ok("card reviews don't add change records", !Object.keys(A.st.mod).some(k => k.startsWith('["cards"')), J(A.st.mod));
  A.tick(); delete A.st.cards.c1; A.save(); B.now = A.now + 5000; B.st.cards.c1 = { b: 5, d: 1 }; B.save();
  await A.sync(cloud); await B.sync(cloud); await A.sync(cloud);
  ok("a card reviewed after its deletion stays", A.st.cards.c1 && A.st.cards.c1.b === 5, J(A.st.cards));
  A.tick(9000); delete A.st.cards.c1; A.save(); await A.sync(cloud); await B.sync(cloud);
  ok("a card deleted after its last review goes", !B.st.cards.c1, J(B.st.cards));
}

{ // 6. theatre logbook undo history and seen questions are not damaged by syncing
  const { A, B, cloud } = await pair({ th: { log: {} }, hub: { seen: ["q0"] } });
  A.tick(); A.st.th.log.n1 = { o: 2, a: 0, p: 0, h: ["o", "o"] }; A.st.hub.seen.push("a1"); A.save();
  B.tick(); B.st.hub.seen.push("b1"); B.save();
  await A.sync(cloud); await B.sync(cloud); await A.sync(cloud);
  ok("undo history ['o','o'] survives", J(A.st.th.log.n1.h) === J(["o", "o"]) && J(B.st.th.log.n1.h) === J(["o", "o"]), J([A.st.th.log, B.st.th.log]));
  ok("seen questions from both devices are combined", J(A.st.hub.seen) === J(["a1", "b1", "q0"]) && J(B.st.hub.seen) === J(A.st.hub.seen), J([A.st.hub.seen, B.st.hub.seen]));
}

{ // 7. old data with no change records still merges (keep everything from both)
  const A = device({ stars: { a: 1 }, t: T0 }), B = device({ stars: { b: 1 }, t: T0 - DAY });
  const M = mergeSt(A.st, B.st, T0);
  ok("records-free copies keep items from both", M.stars.a === 1 && M.stars.b === 1, J(M.stars));
  const L1 = stClean({ th: { log: { n1: { o: 2, h: ["o", "o"] } } }, t: T0 }), L2 = stClean({ th: { log: { n1: { o: 2, h: ["o", "o"] } } }, t: T0 - DAY });
  ok("records-free logbook keeps its undo history", J(mergeSt(L1, L2, T0).th.log.n1.h) === J(["o", "o"]), J(mergeSt(L1, L2, T0).th.log));
  const old = stClean({ cards: { c: { b: 3, d: 9 } }, t: T0, mod: { '["cards","c","b"]': { d: 1, t: T0 + 5 }, '["cards","c"]': { d: 0, t: T0 + 5 } } });
  const legacy = stClean({ cards: { c: { b: 1, d: 1 } }, t: T0 + 50, mod: { '["cards","c"]': { d: 0, t: T0 + 5 } } });
  const fresh = stClean({ cards: { c: { b: 3, d: 9, u: T0 + 100 } }, t: T0 });
  ok("an old-format card record can't override a newer review", mergeSt(legacy, fresh, T0 + 200).cards.c.b === 3, J(mergeSt(legacy, fresh, T0 + 200).cards));
  ok("records left by older versions can't strip fields from a card", mergeSt(old, stClean({ cards: { c: { b: 3, d: 9 } }, t: T0 - 1 }), T0 + 10).cards.c.b === 3);
}

{ // 8. first sync on a new, empty device receives everything
  const cloud = cloudRow();
  const A = device({ stars: { a: 1 }, notes: { a: "n" }, cards: { c: { b: 1, d: 5 } }, days: ["2026-11-20"] }); A.save(); await A.sync(cloud);
  const N = device(); N.tick(DAY); await N.sync(cloud);
  ok("new device gets the cloud progress", N.st.stars.a === 1 && N.st.notes.a === "n" && N.st.cards.c.b === 1 && N.st.days[0] === "2026-11-20", J(N.st));
  const before = J(N.st.mod); N.save();
  ok("receiving the cloud copy is not recorded as a local change", J(N.st.mod) === before, J(N.st.mod));
}

{ // 9. restoring a backup: its values win on other devices, items and whole sections it lacks go too
  const { A, B, cloud } = await pair({ stars: { a: 1, b: 1 }, cards: { c: { b: 3, d: 100 } }, th: { log: { n1: { o: 1 } } } });
  const backup = { stars: { a: 1 }, cards: { c: { b: 1, d: 50 } }, t: T0 - 30 * DAY };
  A.tick(DAY); { const mod = Object.assign({}, A.st.mod); A.st = stClean(clone(backup)); for (const k in A.st.mod) if (!mod[k] || A.st.mod[k].t > mod[k].t) mod[k] = A.st.mod[k]; A.st.mod = mod; A.save(); }
  await A.sync(cloud); await B.sync(cloud);
  ok("restored values reach the other device", J(B.st.stars) === J({ a: 1 }) && B.st.cards.c.b === 1, J([B.st.stars, B.st.cards]));
  ok("a section the backup lacks is removed on the other device too", !B.st.th || !B.st.th.log || !B.st.th.log.n1, J(B.st.th));
}

{ // 10. clocks: a tie ends the same everywhere; a clock that was ahead can't block later changes
  const { A, B, cloud } = await pair({ notes: { a: "x" } });
  A.tick(5000); A.st.notes.a = "from A"; A.save();
  B.now = A.now; B.st.notes.a = "from B"; B.save();
  await A.sync(cloud); await B.sync(cloud); await A.sync(cloud);
  ok("simultaneous edits end the same on both devices", A.st.notes.a === B.st.notes.a, J([A.st.notes, B.st.notes]));
  const realB = B.now; B.now = realB + 365 * DAY; B.st.notes.a = "wrong clock"; B.save(); await B.sync(cloud);
  B.now = realB + 60000;                                                            // clock corrected
  A.tick(120000); await A.sync(cloud); A.st.notes.a = "later edit on A"; A.save(); await A.sync(cloud); await B.sync(cloud);
  ok("a later edit beats one made while a clock was a year ahead", A.st.notes.a === "later edit on A" && B.st.notes.a === "later edit on A", J([A.st.notes, B.st.notes]));
  B.tick(60000); B.st.notes.a = "later edit on B"; B.save(); await B.sync(cloud); await A.sync(cloud);
  ok("the device whose clock was wrong can still change the item", A.st.notes.a === "later edit on B", J(A.st.notes));
}

{ // 11. crafted data cannot reach JavaScript built-ins
  const bad = JSON.parse('{"__proto__":{"polluted":1},"stars":{"a":1},"mod":{"[\\"__proto__\\",\\"hasOwnProperty\\"]":{"d":1,"t":9e15},"[\\"stars\\",\\"__proto__\\"]":{"d":0,"t":9e15}}}');
  const C = stClean(bad); const M = mergeSt(C, device({ stars: { b: 1 } }).st, T0);
  ok("no prototype pollution", ({}).polluted === undefined && C.polluted === undefined && M.polluted === undefined && typeof ({}).hasOwnProperty === "function" && M.stars.a === 1, J(M));
}

{ // 12. defaults are never shared with progress
  const a = stClean(null); a.stars.z = 1; a.days.push("x");
  ok("stClean returns fresh empty objects", J(S0.stars) === "{}" && J(S0.days) === "[]", J(S0));
}

{ // 13. the change list stays small
  const A = device({ stars: {} }); A.save();
  for (let i = 0; i < 6000; i++) { A.st.stars["s" + i] = 1; } A.save();
  for (let i = 0; i < 6000; i++) delete A.st.stars["s" + i]; A.tick(); A.save();
  ok("change records capped at 5000", Object.keys(A.st.mod).length <= 5000, Object.keys(A.st.mod).length);
  A.tick(400 * DAY); A.st.stars.new = 1; A.save();
  ok("records older than a year are dropped", Object.keys(A.st.mod).length === 1, Object.keys(A.st.mod).length);
}

{ // 14. two devices uploading at the same moment: nothing is lost
  const { A, B, cloud } = await pair({ stars: {} });
  A.tick(); A.st.stars.fromA = 1; A.save(); B.tick(); B.st.stars.fromB = 1; B.save();
  const ioA = A.io(cloud), realRead = cloud.read; let raced = false;
  cloud.read = async () => { const r = await realRead(); if (!raced) { raced = true; await B.sync(cloud); } return r; };  // B writes between A's read and A's write
  await syncCycle(ioA, () => A.now); cloud.read = realRead;
  const C = cloud.st();
  ok("the cloud keeps both devices' changes after a simultaneous upload", C.stars.fromA === 1 && C.stars.fromB === 1, J(C.stars));
}

{ // 15. a change made on this device while the cloud was being read is kept
  const { A, cloud } = await pair({ stars: {} });
  const io = A.io(cloud), realRead = cloud.read;
  cloud.read = async () => { const r = await realRead(); A.tick(); A.st.stars.during = 1; A.save(); return r; };
  await syncCycle(io, () => A.now); cloud.read = realRead;
  ok("a change made during a sync is not lost", A.st.stars.during === 1, J(A.st.stars));
}

{ // 16. saving stays fast with a big deck
  const cards = {}; for (let i = 0; i < 6000; i++) cards["c" + i] = { b: i % 5, d: T0 + i };
  const A = device({ cards, stars: {}, read: {} }); A.save();
  const t = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) { A.tick(); A.st.cards["c" + i] = { b: 9, d: T0 }; A.save(); }
  const perSave = Number(process.hrtime.bigint() - t) / 1e6 / 20;
  const t2 = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) { A.tick(); A.st.stars["s" + i] = 1; A.save(); }
  const perSmall = Number(process.hrtime.bigint() - t2) / 1e6 / 20;
  console.log(`       (save with 6000 cards: ${perSave.toFixed(1)} ms after a review, ${perSmall.toFixed(1)} ms after a star; ${(J(A.st).length / 1024).toFixed(0)} KB, change records ${(J(A.st.mod).length / 1024).toFixed(1)} KB)`);
  ok("a save with 6000 cards takes under 40 ms here", perSave < 40, perSave.toFixed(1) + " ms");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
