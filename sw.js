
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e=>{
  console.log(e.request.url);
  e.respondWith(fetch(e.request));
})