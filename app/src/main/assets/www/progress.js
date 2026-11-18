(function (root) {
  "use strict";

  const MAX_BYTES = 4 * 1024 * 1024;
  const MAX_QUIZZES = 300;
  const MAX_DAYS = 200;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const plain = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const clock = value => Number.isSafeInteger(value) && value >= 0;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const reserved = new Set(["t", "quiz", "days", "_changes"]);
  const unsafe = new Set(["__proto__", "prototype", "constructor"]);
  const containers = ["cards", "read", "stars", "notes", "drill", "miss", "ord", "clo", "clr", "dver", "hub", "lab", "thr", "spot"];

  function safe(value, depth = 0) {
    if (depth > 24) return false;
    if (value === null || ["string", "boolean"].includes(typeof value)) return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.every(item => safe(item, depth + 1));
    return plain(value) && Object.keys(value).every(key => !unsafe.has(key) && safe(value[key], depth + 1));
  }

  function changePath(key) {
    try {
      const path = JSON.parse(key);
      return Array.isArray(path) && path.length > 0 && path.length <= 12 &&
        path.every(part => typeof part === "string" && !unsafe.has(part)) && !reserved.has(path[0]) ? path : null;
    } catch { return null; }
  }

  function valid(state) {
    if (!plain(state) || !plain(state.cards) || !safe(state)) return false;
    if (containers.some(key => own(state, key) && !plain(state[key]))) return false;
    if (own(state, "t") && !clock(state.t)) return false;
    if (own(state, "hub") && own(state.hub, "seen") &&
        (!Array.isArray(state.hub.seen) || state.hub.seen.some(id => typeof id !== "string"))) return false;
    if (own(state, "days") && (!Array.isArray(state.days) || state.days.some(day => typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)))) return false;
    if (own(state, "quiz") && (!Array.isArray(state.quiz) || state.quiz.some(attempt =>
      !plain(attempt) || !clock(attempt.t) || !clock(attempt.s) || !clock(attempt.n) || attempt.s > attempt.n ||
      typeof attempt.r !== "string" || (own(attempt, "id") && typeof attempt.id !== "string") ||
      (own(attempt, "by") && (!plain(attempt.by) || Object.values(attempt.by).some(row =>
        !Array.isArray(row) || row.length !== 2 || !row.every(clock))))))) return false;
    if (own(state, "_changes") && (!plain(state._changes) || Object.entries(state._changes).some(([key, time]) =>
      !changePath(key) || !clock(Math.abs(time)) || time === 0))) return false;
    return true;
  }

  function decode(text, defaults) {
    if (typeof text !== "string" || text.length > MAX_BYTES) throw Error("Invalid progress file");
    const value = JSON.parse(text);
    const state = plain(value) && value.format === "ent-companion-progress" ? value.version === 1 && value.progress : value;
    if (!valid(state)) throw Error("Invalid progress file");
    return { ...defaults, ...state };
  }

  function encode(state) {
    return JSON.stringify({ format: "ent-companion-progress", version: 1, progress: state });
  }

  const recordContainers = new Set(["cards", "read", "stars", "notes", "drill", "ord", "clo", "clr", "dver"]);

  function flatten(value, path, out) {
    const record = path.length === 2 && recordContainers.has(path[0]);
    if (plain(value) && !record && path.length < 10 && Object.keys(value).length) {
      for (const [key, item] of Object.entries(value)) {
        if (!unsafe.has(key) && (path.length || !reserved.has(key))) flatten(item, path.concat(key), out);
      }
    } else if (path.length) {
      out.set(JSON.stringify(path), value);
    }
    return out;
  }

  function setAt(root, path, value) {
    let entry = root;
    for (const key of path.slice(0, -1)) {
      if (!plain(entry[key])) entry[key] = {};
      entry = entry[key];
    }
    const key = path[path.length - 1];
    if (path.length === 2 && recordContainers.has(path[0]) || !plain(entry[key]) || !plain(value)) {
      entry[key] = value;
    }
  }

  function track(state, previous, now) {
    const a = flatten(state, [], new Map()), b = flatten(previous, [], new Map());
    const time = Math.max(now, (previous.t || 0) + 1, (state.t || 0) + 1);
    const changes = { ...previous._changes, ...state._changes };
    for (const key of new Set([...a.keys(), ...b.keys()])) {
      if (a.has(key) && (!b.has(key) || !same(a.get(key), b.get(key)))) changes[key] = time;
      if (b.has(key) && !a.has(key)) changes[key] = -time;
      if (a.has(key) && b.has(key) && same(a.get(key), b.get(key)) && !(changes[key] > 0)) {
        const baseline = previous.t || state.t || 0;
        if (baseline) changes[key] = baseline;
        else delete changes[key];
      }
    }
    return { ...state, t: time, _changes: changes };
  }

  function quizId(attempt) {
    return attempt.id || JSON.stringify([attempt.t, attempt.r, attempt.s, attempt.n,
      Object.entries(attempt.by || {}).sort(([a], [b]) => a.localeCompare(b))]);
  }

  function merge(a, b, defaults) {
    const left = flatten(a, [], new Map()), right = flatten(b, [], new Map());
    const ac = a._changes || {}, bc = b._changes || {}, changes = {};
    const merged = { ...defaults };
    // Create fresh containers before rebuilding their records.
    for (const [key, value] of Object.entries(defaults)) {
      if (plain(value)) merged[key] = {};
    }
    const keys = [...new Set([...left.keys(), ...right.keys(), ...Object.keys(ac), ...Object.keys(bc)])];
    keys.sort((x, y) => x.length - y.length || x.localeCompare(y));
    for (const key of keys) {
      const path = changePath(key);
      if (!path) continue;
      const leftValue = left.get(key), rightValue = right.get(key);
      if (path.length === 2 && path[0] === "hub" && path[1] === "seen" &&
          Array.isArray(leftValue) && Array.isArray(rightValue)) {
        setAt(merged, path, [...new Set([...leftValue, ...rightValue])].sort());
        const version = Math.max(ac[key] || a.t || 0, bc[key] || b.t || 0);
        if (version > 0) changes[key] = version;
        continue;
      }
      const av = left.has(key) ? (ac[key] > 0 ? ac[key] : bc[key] < 0 ? 0 : a.t || 0) : ac[key] < 0 ? -ac[key] : -1;
      const bv = right.has(key) ? (bc[key] > 0 ? bc[key] : ac[key] < 0 ? 0 : b.t || 0) : bc[key] < 0 ? -bc[key] : -1;
      if (av < 0 && bv < 0) continue;
      const fromLeft = av > bv || (av === bv && (ac[key] < 0 || !(bc[key] < 0)));
      const source = fromLeft ? left : right;
      const version = fromLeft ? av : bv;
      if (source.has(key)) {
        const value = source.get(key);
        setAt(merged, path, plain(value) ? { ...value } : value);
        if (version) changes[key] = version;
      } else if (version) {
        changes[key] = -version;
      }
    }
    const quiz = new Map();
    for (const attempt of [...(a.quiz || []), ...(b.quiz || [])]) quiz.set(quizId(attempt), attempt);
    merged.quiz = [...quiz.values()].sort((x, y) => x.t - y.t || quizId(x).localeCompare(quizId(y))).slice(-MAX_QUIZZES);
    merged.days = [...new Set([...(a.days || []), ...(b.days || [])])].sort().slice(-MAX_DAYS);
    merged.t = Math.max(a.t || 0, b.t || 0);
    merged._changes = changes;
    return merged;
  }

  const api = { decode, encode, merge, track, MAX_BYTES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ENT_PROGRESS = api;
})(typeof window === "undefined" ? globalThis : window);
