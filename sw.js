
const CACHE = 'study-tracker-v1.2.99d-offline-bandwidth-opt';
const PRECACHE = [
  '/', 
  './index.html', 
  './manifest.json', 
  './logo.svg',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Always bypass cache for live Firebase APIs, but allow caching for gstatic CDNs
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }
  
  // Force iOS Safari WebKit to bypass aggressive HTTP disk cache on navigation & core app files when online
  let fetchPromise;
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json')) {
    fetchPromise = fetch(e.request.url, { cache: 'no-cache', credentials: 'omit' });
  } else {
    fetchPromise = fetch(e.request);
  }

  e.respondWith(
    fetchPromise.then(res => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'default' || res.type === 'cors')) {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

