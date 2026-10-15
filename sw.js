/* Bun Gogh PWA service worker: cache-first app shell, same-origin only. */
const BG_SW_VERSION = "bungogh-v27";
const BG_CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./icon-notif.png",
  "./icon-notif-large.png",
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
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  let url = "./";
  try{ if(e.notification.data && e.notification.data.url) url = e.notification.data.url; }catch(_){}
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { try { c.focus(); } catch (_) {} try{ if(url!=="./" && c.navigate) c.navigate(url); }catch(_){} return c; }
      return self.clients.openWindow(url);
    })
  );
});
/* Push a telefono chiuso (FCM): la Cloud Function "bungoghNotify" invia via Admin SDK,
   qui mostriamo la notifica anche ad app chiusa. Tocco → apre la pagina interessata (?p=). */
try{
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  if(self.firebase && self.firebase.messaging){
    self.firebase.initializeApp({
      apiKey:"AIzaSyBKAPpVFTz4T023oQsjfNlKjYgQh2ohkhs",
      authDomain:"bungogh-app.firebaseapp.com",
      projectId:"bungogh-app",
      storageBucket:"bungogh-app.firebasestorage.app",
      messagingSenderId:"253049794503",
      appId:"1:253049794503:web:96f19779b27f394708f3e2"
    });
    self.firebase.messaging().onBackgroundMessage(function(payload){
      let t="Bun Gogh", b="", tag="bg-fcm", url="./";
      try{
        t=(payload&&(payload.notification&&payload.notification.title))||(payload&&payload.data&&payload.data.title)||t;
        b=(payload&&(payload.notification&&payload.notification.body))||(payload&&payload.data&&payload.data.body)||"";
        tag=(payload&&payload.data&&payload.data.tag)||tag;
        url=(payload&&payload.data&&payload.data.url)||url;
      }catch(_){}
      return self.registration.showNotification(t,{body:b,tag:tag,icon:"icon-notif-large.png",badge:"icon-notif.png",data:{url:url,tag:tag}});
    });
  }
}catch(e){}
self.addEventListener("fetch", (e) => {  if (e.request.method !== "GET") return;
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
