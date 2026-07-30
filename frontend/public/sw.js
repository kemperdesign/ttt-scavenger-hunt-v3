/**
 * St. Augustine TimeQuest — Service Worker
 *
 * Strategy:
 *   - Static assets (JS, CSS, fonts, images): Cache-first
 *   - Map tiles: LRU tile cache (max 500 tiles, stale-while-revalidate)
 *   - API calls: Network-first with stale-while-revalidate fallback
 *   - Offline fallback: /offline page
 *
 * Background Sync: queued GPS check-ins and challenge submissions
 * are retried when connectivity is restored.
 */

const CACHE_VERSION = "v2";
const STATIC_CACHE = `tq-static-${CACHE_VERSION}`;
const TILE_CACHE = `tq-tiles-${CACHE_VERSION}`;
const API_CACHE = `tq-api-${CACHE_VERSION}`;
const MAX_TILE_ENTRIES = 500;
const OFFLINE_URL = "/offline";
const SYNC_TAG = "tq-offline-sync";

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
];

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return (
            key.startsWith("tq-") &&
            ![STATIC_CACHE, TILE_CACHE, API_CACHE].includes(key)
          );
        }).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Map tile requests
  if (url.hostname.includes("maptiler") || url.hostname.includes("tile.") || url.pathname.includes("/tiles/")) {
    event.respondWith(handleTile(request));
    return;
  }

  // API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApi(request));
    return;
  }

  // Static assets
  if (
    url.hostname === self.location.hostname &&
    (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/) || url.pathname === "/")
  ) {
    event.respondWith(handleStatic(request));
    return;
  }

  // Navigation requests — serve offline page if network fails
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    );
    return;
  }
});

// ── Cache strategies ─────────────────────────────────────────────────────────

async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function handleTile(request) {
  const cached = await caches.match(request, { cacheName: TILE_CACHE });
  if (cached) {
    // Revalidate in background
    fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(TILE_CACHE);
        await cache.put(request, response);
        await evictTileCache();
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(request, response.clone());
      evictTileCache();
    }
    return response;
  } catch {
    return new Response("Tile unavailable offline", { status: 503 });
  }
}

async function handleApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.method === "GET") {
      const cached = await caches.match(request, { cacheName: API_CACHE });
      if (cached) return cached;
    }
    return new Response(
      JSON.stringify({ error: "Offline", offline: true }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function evictTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - MAX_TILE_ENTRIES);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ── Background Sync ───────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  // Opens the IndexedDB offline queue and replays pending requests
  const db = await openQueueDB();
  const tx = db.transaction("queue", "readwrite");
  const store = tx.objectStore("queue");
  const items = await getAllFromStore(store);

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      if (response.ok || response.status < 500) {
        // Remove from queue
        const deleteTx = db.transaction("queue", "readwrite");
        deleteTx.objectStore("queue").delete(item.id);
        await deleteTx.done;
      }
    } catch {
      // Keep in queue for next sync
    }
  }
}

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("tq-offline-queue", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
