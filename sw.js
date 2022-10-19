function sleep(ms) {
  const startTime = performance.now();
  while (performance.now() - startTime < ms);
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    new Promise((resolve) => {
      sleep(5000);
      resolve();
    })
  );
});

self.addEventListener("fetch", e=>{
  console.log(e.request.url);
  e.respondWith(fetch(e.request));
})