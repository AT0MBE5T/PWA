import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(async ({ event }) => {
    const cacheKey = getCacheKeyForURL('/index.html') || getCacheKeyForURL('/');
    
    if (cacheKey) {
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
    }

    return Response.error();
}, {
    denylist: [/^\/api/, /__data.json/], 
});

registerRoute(navigationRoute);

setCacheHandler(async ({ event }) => {
    if (event.request.mode === 'navigate') {
        const cacheKey = getCacheKeyForURL('/index.html') || getCacheKeyForURL('/');
        if (cacheKey) return caches.match(cacheKey);
    }
    return Response.error();
});

registerRoute(
    ({ request }) =>
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script',
    new CacheFirst({
        cacheName: 'static-assets-cache',
        plugins: [
            new ExpirationPlugin({ 
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
            })
        ]
    })
);

self.addEventListener('push', function(event) {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/logo.png',
            data: { url: data.url }
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});