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
vm.runInContext(s0[0] + "\n" + core[0] + "\nthis.api={S0,stClean,snapOf,syncDiff,mergeSt,pruneMod};", ctx);
const { S0, stClean, snapOf, syncDiff, mergeSt } = ctx.api;

let pass = 0, fail = 0;
const J = x => JSON.stringify(x);
function ok(name, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? "  → " + detail : "")); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const DAY = 864e5, T0 = Date.UTC(2026, 10, 21);

/* A device: holds progress, a snapshot from its last save, and a clock. */
function device(start) {
  const d = { st: stClean(clone(start || {})), now: T0 };
  d.prev = snapOf(d.st);
  d.save = () => { d.prev = syncDiff(d.prev, d.st, d.now); d.st.t = d.now; };
  d.tick = ms => { d.now += ms || 1000; };
  /* sync with a cloud copy the way sbSync does; returns the new cloud copy */
  d.sync = cloud => {
    if (!cloud) return clone(d.st);
    const R = stClean(clone(cloud)), rt = R.t || 0, lt = d.st.t || 0;
    const M = rt >= lt ? mergeSt(R, d.st, d.now) : mergeSt(d.st, R, d.now);
    M.t = Math.max(rt, lt);
    d.st = M; d.prev = snapOf(d.st);
    return clone(d.st);
  };
  return d;
}
/* two devices that start from the same synced progress */
function pair(start) {
  const A = device(start); A.save();
  let cloud = A.sync(null);
  const B = device(); cloud = B.sync(cloud);
  return { A, B, cloud };
}

console.log("Sync tests");

{ // 1. a deletion on one device is not undone by the other
  const { A, B } = pair({ stars: { a: 1, b: 1 }, notes: { a: "old" }, read: { x: 1 }, miss: { q: { q1: 1, q2: 1 } } });
  A.tick(); delete A.st.stars.a; delete A.st.notes.a; delete A.st.read.x; delete A.st.miss.q.q1; A.save();
  let cloud = A.sync(B.sync(null) /* B's stale copy is in the cloud */);
  ok("deletion wins over the other device's older copy", J(A.st.stars) === J({ b: 1 }) && !A.st.notes.a && !A.st.read.x && J(A.st.miss.q) === J({ q2: 1 }), J([A.st.stars, A.st.notes, A.st.read, A.st.miss]));
  B.tick(5000); cloud = B.sync(cloud);
  ok("the other device receives the deletion", J(B.st.stars) === J({ b: 1 }) && !B.st.notes.a && !B.st.read.x, J([B.st.stars, B.st.notes]));
}

{ // 2. an edit made after a deletion (on the other, not yet synced, device) is kept
  const { A, B, cloud } = pair({ notes: { a: "old" }, miss: { q: { q1: 1 } } });
  A.tick(1000); delete A.st.notes.a; delete A.st.miss.q.q1; A.save();          // A clears at t+1s
  B.tick(2000); B.st.notes.a = "new note"; B.st.miss.q.q1 = 2; B.save();         // B edits at t+2s, before syncing
  let c = A.sync(cloud); c = B.sync(c); c = A.sync(c);
  ok("newer edit survives an older deletion (note)", A.st.notes.a === "new note" && B.st.notes.a === "new note", J([A.st.notes, B.st.notes]));
  ok("newer edit survives an older deletion (mistake)", A.st.miss.q.q1 === 2 && B.st.miss.q.q1 === 2, J([A.st.miss, B.st.miss]));
}

{ // 2b. the device that saved last overall made the OLDER change to the item: the item still follows its own time
  const { A, B, cloud } = pair({ notes: { a: "old" } });
  A.tick(1000); delete A.st.notes.a; A.save();                    // A deletes the note at t+1s
  B.tick(2000); B.st.notes.a = "new note"; B.save();             // B edits it at t+2s
  A.tick(5000); A.st.stars.z = 1; A.save();                      // A then saves something else, so A's copy is newer overall
  let c = B.sync(cloud); c = A.sync(c); c = B.sync(c);
  ok("an item's own change time beats the copy's save time", A.st.notes.a === "new note" && B.st.notes.a === "new note" && A.st.stars.z === 1, J([A.st.notes, B.st.notes]));
}

{ // 3. deleting then adding back sticks
  const { A, B, cloud } = pair({ stars: { a: 1 } });
  A.tick(); delete A.st.stars.a; A.save(); let c = A.sync(cloud); c = B.sync(c);
  B.tick(5000); B.st.stars.a = 1; B.save(); c = B.sync(c); c = A.sync(c);
  ok("re-added item survives the earlier deletion", A.st.stars.a === 1 && B.st.stars.a === 1, J([A.st.stars, B.st.stars]));
}

{ // 4. different items added on each device are both kept
  const { A, B, cloud } = pair({ miss: { q: {} } });
  A.tick(); A.st.miss.q.a = 1; A.st.stars.x = 1; A.save();
  B.tick(); B.st.miss.q.b = 1; B.st.stars.y = 1; B.save();
  let c = A.sync(cloud); c = B.sync(c); c = A.sync(c);
  ok("additions from both devices are kept", J(A.st.miss.q) === J(B.st.miss.q) && A.st.miss.q.a && A.st.miss.q.b && A.st.stars.x && A.st.stars.y, J([A.st.miss.q, A.st.stars]));
}

{ // 5. each flashcard keeps its own latest review, whichever device saved last overall
  const { A, B, cloud } = pair({ cards: { c1: { b: 0, d: 1 }, c2: { b: 0, d: 1 } } });
  A.tick(1000); A.st.cards.c1 = { b: 2, d: 500 }; A.save();          // A reviews c1
  B.tick(2000); B.st.cards.c2 = { b: 3, d: 900 }; B.save();          // B reviews c2 later
  B.tick(3000); B.st.stars.z = 1; B.save();                         // B saves last overall
  let c = B.sync(cloud); c = A.sync(c); c = B.sync(c);
  ok("both reviews kept (per-card)", J(A.st.cards) === J({ c1: { b: 2, d: 500 }, c2: { b: 3, d: 900 } }) && J(B.st.cards) === J(A.st.cards), J([A.st.cards, B.st.cards]));
  A.tick(10000); A.st.cards.c2 = { b: 4, d: 2000 }; A.save(); c = A.sync(c); c = B.sync(c);
  ok("the later review of the same card wins", B.st.cards.c2.b === 4, J(B.st.cards));
}

{ // 6. theatre logbook: undo history is not collapsed by syncing
  const { A, B, cloud } = pair({ th: { log: {} } });
  A.tick(); A.st.th.log.n1 = { o: 2, a: 0, p: 0, h: ["o", "o"] }; A.save();
  let c = A.sync(cloud); c = B.sync(c); c = A.sync(c);
  ok("undo history ['o','o'] survives", J(A.st.th.log.n1.h) === J(["o", "o"]) && J(B.st.th.log.n1.h) === J(["o", "o"]), J([A.st.th.log, B.st.th.log]));
}

{ // 7. old data with no change records still merges (keep everything from both)
  const A = device({ stars: { a: 1 }, t: T0 }), B = device({ stars: { b: 1 }, t: T0 - DAY });
  const M = mergeSt(A.st, B.st, T0);
  ok("records-free copies keep items from both", M.stars.a === 1 && M.stars.b === 1, J(M.stars));
  const L1 = stClean({ th: { log: { n1: { o: 2, h: ["o", "o"] } } }, t: T0 }), L2 = stClean({ th: { log: { n1: { o: 2, h: ["o", "o"] } } }, t: T0 - DAY });
  ok("records-free logbook keeps its undo history", J(mergeSt(L1, L2, T0).th.log.n1.h) === J(["o", "o"]), J(mergeSt(L1, L2, T0).th.log));
}

{ // 8. first sync on a new, empty device receives everything
  const A = device({ stars: { a: 1 }, notes: { a: "n" }, cards: { c: { b: 1, d: 5 } }, days: ["2026-11-20"] }); A.save();
  const cloud = A.sync(null); const N = device(); N.tick(DAY); N.sync(cloud);
  ok("new device gets the cloud progress", N.st.stars.a === 1 && N.st.notes.a === "n" && N.st.cards.c.b === 1 && N.st.days[0] === "2026-11-20", J(N.st));
  N.save();
  ok("receiving the cloud copy is not recorded as a local change", Object.keys(N.st.mod).length === Object.keys(A.st.mod).length, J(N.st.mod));
}

{ // 9. restoring a backup: its values win on other devices, items it lacks go too
  const { A, B, cloud } = pair({ stars: { a: 1, b: 1 }, cards: { c: { b: 3, d: 100 } } });
  const backup = { stars: { a: 1 }, cards: { c: { b: 1, d: 50 } }, t: T0 - 30 * DAY };
  A.tick(DAY); { const mod = Object.assign({}, A.st.mod); A.st = stClean(clone(backup)); A.st.mod = Object.assign(mod, A.st.mod); A.save(); }
  let c = A.sync(cloud); c = B.sync(c);
  ok("restored values reach the other device", J(B.st.stars) === J({ a: 1 }) && B.st.cards.c.b === 1, J([B.st.stars, B.st.cards]));
}

{ // 10. clock difference: devices compare change times; a tie goes to the copy saved last
  const { A, B, cloud } = pair({ notes: { a: "x" } });
  A.tick(5000); A.st.notes.a = "from A"; A.save();
  B.now = A.now; B.st.notes.a = "from B"; B.save();          // same instant on both clocks
  let c = A.sync(cloud); c = B.sync(c);
  ok("simultaneous edits end the same on both devices", (c = A.sync(c), A.st.notes.a === B.st.notes.a), J([A.st.notes, B.st.notes]));
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
  A.tick(200 * DAY); A.st.stars.new = 1; A.save();
  ok("records older than 180 days are dropped", Object.keys(A.st.mod).length === 1, Object.keys(A.st.mod).length);
}

{ // 14. saving stays fast with a big deck
  const cards = {}; for (let i = 0; i < 6000; i++) cards["c" + i] = { b: i % 5, d: T0 + i };
  const A = device({ cards, stars: {}, read: {} }); A.save();
  const t = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) { A.tick(); A.st.cards["c" + i] = { b: 9, d: T0 }; A.save(); }
  const perSave = Number(process.hrtime.bigint() - t) / 1e6 / 20;
  const t2 = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) { A.tick(); A.st.stars["s" + i] = 1; A.save(); }
  const perSmall = Number(process.hrtime.bigint() - t2) / 1e6 / 20;
  console.log(`       (save with 6000 cards: ${perSave.toFixed(1)} ms after a review, ${perSmall.toFixed(1)} ms after a star)`);
  ok("a save with 6000 cards takes under 40 ms here", perSave < 40, perSave.toFixed(1) + " ms");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
