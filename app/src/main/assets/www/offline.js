(function () {
  "use strict";
  if (!window.ENT_RELEASE_ASSETS?.web || !("serviceWorker" in navigator)) return;

  let registration;
  let refreshPrompt;
  const active = new Set();
  let packs = [];

  window.addEventListener("load", async () => {
    try {
      const hadWorker = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadWorker) {
          if (!refreshPrompt) {
            refreshPrompt = document.createElement("button");
            refreshPrompt.className = "upbar";
            refreshPrompt.textContent = "Update ready · Reload app";
            refreshPrompt.addEventListener("click", () => location.reload());
            document.body.append(refreshPrompt);
          }
        }
        refresh();
      });
      registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
      refresh();
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) registration.update().catch(() => {});
      });
    } catch {
      setStatus("Offline storage is unavailable in this browser.");
    }
  });

  function setStatus(message) {
    const node = document.querySelector("#offline-status");
    if (node) node.textContent = message;
  }

  async function request(action, id) {
    const worker = navigator.serviceWorker.controller || registration?.active;
    if (!worker) throw Error("Offline setup is still in progress. Try again shortly.");
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let timeout;
      function finish(value, failed) {
        clearTimeout(timeout);
        channel.port1.close();
        if (failed) reject(Error(value));
        else resolve(value);
      }
      function waitForReply() {
        clearTimeout(timeout);
        timeout = setTimeout(() => finish("Download paused. Retry to resume.", true), 45000);
      }
      channel.port1.onmessage = ({ data }) => {
        if (data.progress) {
          const { done, total } = data.progress;
          setStatus(`Downloading ${done} of ${total} files…`);
          waitForReply();
          return;
        }
        if (data.packs) packs = data.packs;
        finish(data.error || packs, !!data.error);
      };
      waitForReply();
      worker.postMessage({ action, id }, [channel.port2]);
    });
  }

  function draw(preserveStatus) {
    const rows = document.querySelector("#offline-packs");
    if (!rows) return;
    rows.replaceChildren();
    for (const pack of packs) {
      const row = document.createElement("div");
      row.className = "srow";
      const label = document.createElement("span");
      label.textContent = `${pack.label} · ${(pack.bytes / 1e6).toFixed(1)} MB`;
      const button = document.createElement("button");
      button.className = "btn";
      button.dataset.offlinePack = pack.id;
      button.disabled = pack.ready || active.has(pack.id);
      button.textContent = pack.ready ? "Saved" : active.has(pack.id) ? "Downloading…" : "Download";
      row.append(label, button);
      rows.append(row);
    }
    if (!preserveStatus) setStatus("Core app saved. Add the study material you need offline.");
  }

  async function refresh() {
    if (!document.querySelector("#offline-packs")) return;
    try {
      await request("status");
      draw(active.size > 0);
    } catch (error) { setStatus(error.message); }
  }

  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-offline-pack]");
    if (!button) return;
    const id = button.dataset.offlinePack;
    if (active.has(id)) return;
    active.add(id);
    draw(true);
    try {
      await request("download", id);
      setStatus("Download saved for offline use.");
    } catch (error) { setStatus(error.message); }
    finally {
      active.delete(id);
      draw(true);
    }
  });

  window.ENT_SHOW_OFFLINE = refresh;
})();
