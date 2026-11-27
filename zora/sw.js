const CACHE='zora-personal-shell-v031b-20261127';
const FILES=['/zora/','/zora/index.html','/zora/manifest.webmanifest','/zora/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('zora-personal-shell')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==self.location.origin||!u.pathname.startsWith('/zora/'))return;
 if(e.request.mode==='navigate'){
  e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(e.request,{cache:'reload'});if(response.ok){await cache.put(e.request,response.clone());return response;}const saved=await cache.match(e.request)||await cache.match('/zora/');return saved||response;}catch(error){const saved=await cache.match(e.request)||await cache.match('/zora/');if(saved)return saved;throw error;}})());
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
