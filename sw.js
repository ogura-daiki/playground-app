
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

importScripts("./isLocalhost.js");

const responseFromData = ({value, type}) => new Response(new Blob([value], {type}), {status:200, statusText:"OK"});
const files = new Map(Object.entries({
  "/test2.html":{
    type:"text/html",
    value:`
    Upgrade or make this repository public to enable Pages
    GitHub Pages is designed to host your personal, organization, or project pages from a GitHub repository.
      
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jschardet/3.0.0/jschardet.min.js"></script>
    <script>
        console.log(jschardet);
    </script>
    `,
  },
}));
const getFile = (url)=>{
  const baseURL = location.origin+(isLocalhost?"":"/playground-app");
  if(!url.startsWith(baseURL)) return;
  const path = url.slice(baseURL.length);
  if(!files.has(path)) return;
  const data = files.get(path);
  if(typeof data === "function"){
    return data();
  }
  return responseFromData(data);
}

self.addEventListener("fetch", e=>{
  console.log(e.request.url);
  const fileResponse = getFile(e.request.url);
  if(fileResponse){
    e.respondWith(fileResponse);
    return;
  }
  e.respondWith(fetch(e.request));
})