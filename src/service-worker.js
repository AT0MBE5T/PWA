import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 3,
        plugins: [
            {
                handlerDidError: async () => {
                    return (await matchPrecache('/')) || Response.error();
                }
            }
        ]
    })
);

registerRoute(
({ url }) => {
        if (url.pathname.includes('/api/accounts/ping')) {
            return false; 
        }
        
        return url.pathname.includes('__data.json');
    },
    new NetworkFirst({
        cacheName: 'sveltekit-data-cache',
        networkTimeoutSeconds: 3,
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
            })
        ]
    })
);

registerRoute(
    ({ request, url }) =>
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.endsWith('favicon.ico'),
    new StaleWhileRevalidate({
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