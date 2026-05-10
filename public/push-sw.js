// Monev Offline-First Service Worker
// Handles push notifications, offline caching, and background sync.

const VERSION = "v2.0";
const STATIC_CACHE = `monev-static-${VERSION}`;
const PAGE_CACHE = `monev-pages-${VERSION}`;
const IMAGE_CACHE = `monev-images-${VERSION}`;
const RUNTIME_CACHE = `monev-runtime-${VERSION}`;

const PRECACHE_ASSETS = [
    "/",
    "/dashboard",
    "/transactions",
    "/offline",
    "/icon.svg",
    "/icon-192.png",
    "/icon-512.png",
    "/manifest.json",
];

const MAX_ENTRIES = {
    [PAGE_CACHE]: 20,
    [IMAGE_CACHE]: 60,
    [RUNTIME_CACHE]: 80,
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: "reload" })));
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    const allowedCaches = new Set([STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE, RUNTIME_CACHE]);
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(keys.filter((key) => !allowedCaches.has(key)).map((key) => caches.delete(key)))
            ),
            self.registration.navigationPreload?.enable?.(),
        ])
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") return;
    if (!request.url.startsWith(self.location.origin)) return;

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.includes("/api/auth")) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(networkFirstPage(event));
        return;
    }

    if (url.pathname.startsWith("/_next/static/") || isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    if (request.destination === "image" || url.pathname.startsWith("/_next/image")) {
        event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
        return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function networkFirstPage(event) {
    const { request, preloadResponse } = event;
    const cache = await caches.open(PAGE_CACHE);

    try {
        const response = (await preloadResponse) || await fetch(request);
        if (isCacheable(response)) {
            await cache.put(request, response.clone());
            await trimCache(PAGE_CACHE);
        }
        return response;
    } catch (_error) {
        return (await cache.match(request)) ||
            (await caches.match("/offline")) ||
            (await caches.match("/")) ||
            new Response("Offline", { status: 503 });
    }
}

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (isCacheable(response)) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
    }
    return response;
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const networkPromise = fetch(request)
        .then(async (response) => {
            if (isCacheable(response)) {
                await cache.put(request, response.clone());
                await trimCache(cacheName);
            }
            return response;
        })
        .catch(() => cached);

    return cached || networkPromise;
}

function isCacheable(response) {
    return response && response.status === 200 && (response.type === "basic" || response.type === "default");
}

function isStaticAsset(pathname) {
    return /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf)$/i.test(pathname);
}

async function trimCache(cacheName) {
    const maxEntries = MAX_ENTRIES[cacheName];
    if (!maxEntries) return;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;

    await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};

    const title = data.title || "Monev";
    const options = {
        body: data.body || "Kamu punya notifikasi baru!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || "monev-notification",
        data: {
            url: data.url || "/dashboard",
        },
        vibrate: [100, 50, 100],
        actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/dashboard";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                return self.clients.openWindow(url);
            })
    );
});

self.addEventListener("sync", (event) => {
    if (event.tag === "sync-transactions") {
        event.waitUntil(syncOfflineTransactions());
    }
});

async function syncOfflineTransactions() {
    try {
        console.log("[SW] Syncing offline transactions...");
        // Future: read from IndexedDB and POST to /api/transactions.
    } catch (error) {
        console.error("[SW] Sync failed:", error);
    }
}
