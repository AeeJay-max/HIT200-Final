const CACHE_NAME = 'city-pulse-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/', '/index.html', '/vite.svg']);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Exclude mapping CDNs and OSRM explicitly to guard against CORS opaque cache breaking MapLibre rendering
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    if (event.request.method === 'POST' && event.request.url.includes('/citizen/create-issue')) {
        // We let the frontend handle the IndexedDB storage when offline
        // but we could also intercept here if we wanted deeper background sync
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(err => {
                console.warn('[SW] Fetch failed:', event.request.url, err);
                // Return a generic error response or just let it fail silently
                return new Response('Network error occurred', {
                    status: 408,
                    statusText: 'Network error occurred'
                });
            });
        })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-issues') {
        event.waitUntil(syncIssues());
    }
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'New Update', message: 'Check City Pulse' };
    const options = {
        body: data.message,
        icon: '/civic.svg',
        badge: '/civic.svg',
        data: data,
        vibrate: [100, 50, 100],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

async function syncIssues() {
    // Logic to pull from IndexedDB and push to API when online
    console.log('Background sync triggered for issues');
}
