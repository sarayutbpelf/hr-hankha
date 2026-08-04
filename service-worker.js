/**
 * Service Worker — แคชไฟล์หลักของแอปเพื่อให้เปิดใช้งานได้แม้ออฟไลน์
 * ใช้ path แบบสัมพัทธ์ (relative) เพื่อให้ทำงานถูกต้องเมื่อ deploy บน
 * GitHub Pages ใน sub-path เช่น https://user.github.io/hr-hankha/
 */
const CACHE_NAME = "hrhk-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./registry.html",
  "./personnel.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/mockdata.js",
  "./js/api.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/registry.js",
  "./js/personnel.js",
  "./js/pwa.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // don't cache API writes/reads to Apps Script
  if (new URL(req.url).origin !== location.origin) return; // let CDN/API calls pass through normally

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
