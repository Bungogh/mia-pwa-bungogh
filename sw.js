/* Bun Gogh PWA service worker: cache-first app shell, same-origin only. */
const BG_SW_VERSION = "bungogh-v9";
const BG_CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./qrcode.min.js"
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(BG_SW_VERSION)
      .then((c) => c.addAll(BG_CORE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== BG_SW_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(e.request).then((r) => {
        if (r && r.ok) {
          const cp = r.clone();
          caches.open(BG_SW_VERSION).then((c) => c.put(e.request, cp));
        }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
