importScripts("sw-manifest.js");

const manifest = self.ENT_OFFLINE;
const prefix = "ent-companion-";
const coreName = prefix + "core-" + manifest.version;
const scope = new URL(self.registration.scope);
const urlFor = path => new URL(path, scope).href;
const corePaths = new Set(manifest.core);
const byPath = new Map();
const pending = new Map();

for (const [id, pack] of Object.entries(manifest.packs)) {
  for (const path of pack.files) byPath.set(path, id);
}
const packName = id => prefix + "pack-" + id + "-" + manifest.packs[id].version;
const marker = id => urlFor(".offline-ready/" + id);

async function fetchAsset(path) {
  const response = await fetch(urlFor(path), { cache: "reload" });
  if (!response.ok || response.redirected ||
      (!path.endsWith(".html") && (response.headers.get("Content-Type") || "").includes("text/html"))) {
    throw Error("Could not save " + path);
  }
  return response;
}

self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(coreName);
  for (let i = 0; i < manifest.core.length; i += 8) {
    await Promise.all(manifest.core.slice(i, i + 8).map(async path =>
      cache.put(urlFor(path), await fetchAsset(path))));
  }
  await self.skipWaiting();
})()));

self.addEventListener("activate", event => event.waitUntil((async () => {
  const keep = new Set([coreName, ...Object.keys(manifest.packs).map(packName)]);
  for (const name of await caches.keys()) {
    if (!keep.has(name) && (name.startsWith(prefix) || name.startsWith("ent-atlas-"))) await caches.delete(name);
  }
  await self.clients.claim();
})()));

async function status() {
  const result = [];
  for (const [id, pack] of Object.entries(manifest.packs)) {
    const cache = await caches.open(packName(id));
    const keys = new Set((await cache.keys()).map(request => request.url));
    result.push({ id, label: pack.label, bytes: pack.bytes,
      ready: keys.has(marker(id)) && pack.files.every(path => keys.has(urlFor(path))) });
  }
  return result;
}

function download(id, reply) {
  if (pending.has(id)) return pending.get(id);
  const pack = manifest.packs[id];
  if (!pack) return Promise.reject(Error("Unknown download"));
  const promise = (async () => {
    const cache = await caches.open(packName(id));
    await cache.delete(marker(id));
    const keys = new Set((await cache.keys()).map(request => request.url));
    const missing = pack.files.filter(path => !keys.has(urlFor(path)));
    let done = pack.files.length - missing.length;
    reply({ done, total: pack.files.length });
    for (let i = 0; i < missing.length; i += 6) {
      const results = await Promise.allSettled(missing.slice(i, i + 6).map(async path => {
        await cache.put(urlFor(path), await fetchAsset(path));
        reply({ done: ++done, total: pack.files.length });
      }));
      const failed = results.find(result => result.status === "rejected");
      if (failed) throw failed.reason;
    }
    await cache.put(marker(id), new Response("ready"));
  })().finally(() => pending.delete(id));
  pending.set(id, promise);
  return promise;
}

self.addEventListener("message", event => {
  const { action, id } = event.data || {};
  const port = event.ports[0];
  if (!port || !["status", "download"].includes(action)) return;
  const reply = message => port.postMessage(message);
  event.waitUntil((async () => {
    try {
      if (action === "download") await download(id, progress => reply({ progress }));
      reply({ packs: await status() });
    } catch {
      reply({ error: "Download incomplete. Check your connection and storage, then retry.", packs: await status().catch(() => []) });
    }
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  const asset = request.mode === "navigate" && (path === "" || path === "index.html") ? "index.html" : path;
  const id = byPath.get(asset);
  const name = id ? packName(id) : corePaths.has(asset) ? coreName : null;
  if (!name) return;
  event.respondWith((async () => {
    const cache = await caches.open(name);
    return await cache.match(urlFor(asset)) || fetch(request);
  })());
});
