"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const web = path.join(__dirname, "../app/src/main/assets/www");
const progress = require(path.join(web, "progress.js"));
const empty = () => ({ cards: {}, read: {}, stars: {}, notes: {}, quiz: [], days: [], t: 0 });

test("invalid backups leave the previous snapshot usable, and old and new formats restore", () => {
  const before = { ...empty(), stars: { one: true }, t: 10 };
  assert.throws(() => progress.decode('{"cards":{},"days":null}', empty()));
  assert.throws(() => progress.decode('{"cards":{},"hub":{"seen":{}}}', empty()));
  assert.throws(() => progress.decode('{"cards":{"__proto__":{"polluted":true}}}', empty()));
  assert.deepEqual(progress.decode(JSON.stringify(before), empty()), before);
  assert.deepEqual(progress.decode(progress.encode(before), empty()), before);
});

test("sync preserves a deletion through unrelated offline work and can apply a later re-add", () => {
  const common = { ...empty(), stars: { one: true, two: true }, t: 10 };
  const removed = progress.track({ ...common, stars: { two: true } }, common, 20);
  const laterLegacy = { ...common, notes: { different: "A note" }, t: 30 };
  const merged = progress.merge(laterLegacy, removed, empty());
  assert.deepEqual(merged.stars, { two: true });
  assert.deepEqual(merged.notes, laterLegacy.notes);
  const restored = progress.track({ ...merged, stars: { ...merged.stars, one: true } }, merged, 40);
  assert.deepEqual(progress.merge(removed, restored, empty()).stars, common.stars);
});

test("sync keeps distinct quiz attempts and deduplicates across repeated merges", () => {
  const base = { t: 10, r: "ear", s: 4, n: 5 };
  const a = { ...empty(), quiz: [base, { ...base, id: "device-a", t: 20 }] };
  const b = { ...empty(), quiz: [{ ...base }, { ...base, id: "device-b", t: 20 }] };
  const merged = progress.merge(a, b, empty());
  assert.deepEqual(merged.quiz, [base, a.quiz[1], b.quiz[1]]);
  assert.deepEqual(progress.merge(merged, b, empty()).quiz, merged.quiz);
});

test("dose rules reject missing age and invalid inputs and detect calculation edits", () => {
  const window = {};
  vm.runInNewContext(readFileSync(path.join(web, "clinic/calc.js"), "utf8"), {
    window, document: { addEventListener() {} },
  });
  const { validate, RULES, fp } = window.DOSECALC;
  const rule = RULES.find(rule => rule.id === "amox_kg");
  const values = { kg: "20", y: "5", mo: "", inr: "", hep: "", la: {} };
  assert.equal(validate(rule, values).errors.length, 0);
  assert.ok(validate(rule, { ...values, y: "" }).errors.includes("Enter the age."));
  for (const bad of ["-20", "250.1", "20kg", "Infinity", "0.49"]) {
    assert.ok(validate(rule, { ...values, kg: bad }).errors.length, bad);
  }
  assert.ok(validate(rule, { ...values, y: "0" }).errors.length);
  assert.ok(validate(rule, { ...values, mo: "12" }).errors.length);
  assert.notEqual(fp(rule), fp({ ...rule, per: rule.per + 1 }));
  assert.notEqual(fp(rule), fp({ ...rule, max: rule.max + 1 }));
  assert.notEqual(fp(rule), fp({ ...rule, u: "g" }));
});

test("an incomplete offline pack remains retryable and never records success", async () => {
  const handlers = {};
  const stored = new Map();
  let fail = true;
  const scope = "https://offline.test/";
  const self = {
    ENT_OFFLINE: {
      version: "test", core: [], packs: { clinical: {
        version: "test", label: "Clinical articles", bytes: 10, files: ["one.js", "two.js"],
      }},
    },
    registration: { scope },
    addEventListener(name, handler) { handlers[name] = handler; },
  };
  const cache = {
    async keys() { return [...stored.keys()].map(url => ({ url })); },
    async put(url, data) { stored.set(url, data); },
    async delete(url) { stored.delete(url); },
  };
  vm.runInNewContext(readFileSync(path.join(__dirname, "../web/sw.js"), "utf8"), {
    self, URL, Response, importScripts() {}, caches: { async open() { return cache; } },
    async fetch(url) { return new Response("asset", { status: fail && url.endsWith("two.js") ? 503 : 200 }); },
  });
  async function download() {
    const replies = [];
    await new Promise(resolve => handlers.message({
      data: { action: "download", id: "clinical" },
      ports: [{ postMessage(reply) { replies.push(reply); } }],
      waitUntil: resolve,
    }));
    return replies.at(-1);
  }
  const failed = await download();
  assert.match(failed.error, /incomplete/);
  assert.equal(failed.packs[0].ready, false);
  assert.equal(stored.size, 1);
  fail = false;
  const retried = await download();
  assert.equal(retried.packs[0].ready, true);
  assert.equal(stored.size, 3);
});
