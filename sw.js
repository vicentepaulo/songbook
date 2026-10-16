/* Songbook — modo offline.
   Guarda o app no aparelho na primeira visita. Depois abre do cache (sem internet) e,
   quando houver internet, baixa a versão nova em segundo plano para a próxima abertura.
   Os dados (músicas, PDFs, áudios, anotações) ficam no IndexedDB do navegador, não aqui. */
const CACHE='songbook-v1';
const FILES=['./','./index.html','./songbook.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(req,{ignoreSearch:true});
    const fresh=fetch(req).then(res=>{if(res&&res.ok)cache.put(req,res.clone());return res;}).catch(()=>null);
    if(cached){e.waitUntil(fresh);return cached;}
    const res=await fresh;
    if(res)return res;
    if(req.mode==='navigate')return (await cache.match('./songbook.html'))||Response.error();
    return Response.error();
  }));
});
