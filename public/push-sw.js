// Monev Offline-First Service Worker
// Handles push notifications, offline caching, and background sync

const CACHE_NAME = "monev-v1";
const OFFLINE_URL = "/offline";

// Assets to pre-cache for offline support
const PRECACHE_ASSETS = [
    "/",
    "/icon.svg",
    "/manifest.json",
];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Pre-caching essential assets");
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API requests (don't cache dynamic data)
    if (request.url.includes("/api/")) return;

    // Skip Chrome extensions and other non-http requests
    if (!request.url.startsWith("http")) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response before caching
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // If requesting a page, show offline page
                    if (request.destination === "document") {
                        return caches.match("/");
                    }
                    return new Response("Offline", { status: 503 });
                });
            })
    );
});

// Push notifications
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

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click
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

// Background sync for offline transactions
self.addEventListener("sync", (event) => {
    if (event.tag === "sync-transactions") {
        event.waitUntil(syncOfflineTransactions());
    }
});

async function syncOfflineTransactions() {
    try {
        console.log("[SW] Syncing offline transactions...");
        // Future: read from IndexedDB and POST to /api/transactions
    } catch (error) {
        console.error("[SW] Sync failed:", error);
    }
}
