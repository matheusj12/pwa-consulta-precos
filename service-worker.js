/**
 * Offline-first service worker.
 *
 * IMPORTANT: bump CACHE_VERSION any time produtos.json (or any file below)
 * changes. Browsers only re-check a service worker for updates by comparing
 * these bytes — if this file is byte-identical to what's already installed,
 * a changed produtos.json alone will NOT trigger the "novo catálogo
 * disponível" prompt. See README.md for the release checklist.
 */
const CACHE_VERSION = 'v2';
const CACHE_NAME = `atacadao-cache-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/app.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/utils.js',
  '/js/storage.js',
  '/js/service.js',
  '/js/search.js',
  '/js/ui.js',
  '/js/app.js',
  '/data/produtos.json',
  '/assets/logo.png',
  '/assets/splash.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isCatalog = url.pathname.endsWith('/data/produtos.json');
  event.respondWith(isCatalog ? networkFirst(request) : cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function putInCache(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}
