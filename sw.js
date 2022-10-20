
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e=>{
  console.log(location);
  if(new URL(e.request.url).pathname.split("/").map(v=>v.trim()).filter(v=>v).pop() === "test2.html"){
    e.respondWith(new Response(new Blob([`Upgrade or make this repository public to enable Pages
    GitHub Pages is designed to host your personal, organization, or project pages from a GitHub repository.
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jschardet/3.0.0/jschardet.min.js"></script>
    <script>
        console.log(jschardet);
    </script>`], {type:"text/html"}), {status:200, statusText:"OK", }));
    return;
  }
  e.respondWith(fetch(e.request));
})