// 오프라인 열람용: 온라인이면 최신본을 받아 캐시에 덮어쓰고, 오프라인이면 캐시로 응답 (같은 출처 GET 만)
const CACHE = 'roadtrip-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'no-cache'})).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const key = u.origin + u.pathname;   // 쿼리를 뗀 한 칸만 쓴다 → 오프라인에서 항상 마지막으로 받은 최신본
  // cache:'no-cache' = HTTP 캐시를 믿지 않고 서버에 재검증 (안 그러면 수정본이 한동안 반영되지 않는다)
  e.respondWith(fetch(e.request.url, {cache: 'no-cache'}).then(r => {
    if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(key, copy))); }
    return r;
  }).catch(() => caches.match(key).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
