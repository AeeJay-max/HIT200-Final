self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.message || data.body || "New update available",
                icon: '/civic.svg',
                vibrate: [200, 100, 200],
                data: {
                    url: '/citizen/notifications'
                }
            };
            event.waitUntil(
                self.registration.showNotification(data.title || "City Pulse", options)
            );
        } catch (err) {
            console.error("Push Error", err);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(event.notification.data.url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});

const CACHE_NAME = 'city-pulse-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/civic.svg',
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version immediately while syncing in background
            if (cachedResponse) {
                fetch(event.request).then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
                    }
                }).catch(() => { });
                return cachedResponse;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') return response;
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            });
        })
    );
});
