// Study Tracker Service Worker — v2.2.0
// Strategy: Network-first for core files, Cache-first for CDN assets

const VERSION = 'v2.2.0';
const CACHE_CORE = `study-tracker-core-${VERSION}`;
const CACHE_CDN  = `study-tracker-cdn-${VERSION}`;

// Core app files — always network-first, fall back to cache
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
];

// Heavy CDN assets — cache-first (they are versioned URLs, safe to cache forever)
const CDN_FILES = [
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.1/dist/confetti.browser.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      // Pre-cache core app files
      caches.open(CACHE_CORE).then(c =>
        Promise.allSettled(CORE_FILES.map(url => c.add(url)))
      ),
      // Pre-cache CDN assets
      caches.open(CACHE_CDN).then(c =>
        Promise.allSettled(CDN_FILES.map(url => c.add(url)))
      ),
    ])
  );
  // Take over immediately without waiting for old SW to expire
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  const VALID = new Set([CACHE_CORE, CACHE_CDN]);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !VALID.has(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 1. Always bypass SW for Firebase / Firestore / Google Auth APIs
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com')
  ) {
    return; // Let browser handle directly
  }

  // 2. CDN assets → Cache-first (they're immutable versioned URLs)
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.open(CACHE_CDN).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh && fresh.status === 200) {
          cache.put(e.request, fresh.clone()).catch(() => {});
        }
        return fresh;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 3. Core app files (navigate, .html, .json, .js, .css, .svg) → Network-first
  //    Forces fresh content on every load (critical for update delivery to iOS)
  const isCoreFile =
    e.request.mode === 'navigate' ||
    /\.(html|js|css|json|svg)(\?.*)?$/.test(url.pathname);

  if (isCoreFile) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            caches.open(CACHE_CORE).then(c => c.put(e.request, res.clone())).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  // 4. Everything else (images, fonts, etc.) → Stale-while-revalidate
  e.respondWith(
    caches.open(CACHE_CORE).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const networkFetch = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          cache.put(e.request, res.clone()).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      // Return cached immediately, update in background
      return cached || networkFetch;
    })
  );
});

// ── MESSAGES ─────────────────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
