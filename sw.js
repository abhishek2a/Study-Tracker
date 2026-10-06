// Study Tracker Service Worker — v2.2.0
// Strategy: Network-first for core files, Cache-first for CDN assets

const VERSION = 'v2.2.1';
const CACHE_CORE = `study-tracker-core-${VERSION}`;
const CACHE_CDN  = `study-tracker-cdn-${VERSION}`;

// Core app files — always network-first, fall back to cache
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
];

// Heavy CDN assets — cache-first (immutable versioned URLs, safe to cache forever)
const CDN_FILES = [
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.1/dist/confetti.browser.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
];

// Helper: return a safe offline fallback Response (never undefined)
function offlineFallback(url) {
  const isHtml = url && url.pathname && (url.pathname.endsWith('.html') || url.pathname === '/');
  if (isHtml) {
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Study Tracker — Offline</title></head>
       <body style="background:#020305;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;
       justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
         <div style="font-size:2.5rem">⚡</div>
         <div style="font-size:1.2rem;font-weight:800">StudyTracker</div>
         <div style="color:#64748b;font-size:0.85rem">You're offline — connect to the internet to continue</div>
       </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
  // For non-HTML (JS, JSON, images etc.) return a minimal 503
  return new Response('Service Unavailable (offline)', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_CORE).then(c =>
        Promise.allSettled(CORE_FILES.map(url => c.add(url)))
      ),
      caches.open(CACHE_CDN).then(c =>
        Promise.allSettled(CDN_FILES.map(url => c.add(url)))
      ),
    ])
  );
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  const VALID = new Set([CACHE_CORE, CACHE_CDN]);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !VALID.has(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(e.request.url);
  } catch (_) {
    return; // Invalid URL — let the browser handle it
  }

  // 1. Always bypass SW for Firebase / Firestore / Google Auth
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com')
  ) {
    return;
  }

  // 2. CDN assets → Cache-first
  if (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    e.respondWith(
      caches.open(CACHE_CDN).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(e.request);
          if (fresh && fresh.status === 200) {
            cache.put(e.request, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch (_) {
          return offlineFallback(url);
        }
      }).catch(() => offlineFallback(url))
    );
    return;
  }

  // 3. Core app files → Network-first with no-cache, fall back to cache
  const isCoreFile =
    e.request.mode === 'navigate' ||
    /\.(html|js|css|json|svg)(\?.*)?$/.test(url.pathname);

  if (isCoreFile) {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(e.request.url, { cache: 'no-cache' });
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const cache = await caches.open(CACHE_CORE);
            cache.put(e.request, res.clone()).catch(() => {});
          }
          return res;
        } catch (_) {
          // Network failed — try cache
          const cached = await caches.match(e.request, { ignoreSearch: true });
          return cached || offlineFallback(url);
        }
      })()
    );
    return;
  }

  // 4. Everything else (images, fonts, etc.) → Stale-while-revalidate
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_CORE);
      const cached = await cache.match(e.request, { ignoreSearch: true });

      // Kick off a background network update
      const networkPromise = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          cache.put(e.request, res.clone()).catch(() => {});
        }
        return res;
      }).catch(() => null);

      // Return cached version immediately if available; otherwise wait for network
      if (cached) return cached;
      const fresh = await networkPromise;
      return fresh || offlineFallback(url);
    })()
  );
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
