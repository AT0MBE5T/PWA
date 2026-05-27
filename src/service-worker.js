import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(async ({ event }) => {
    try {
        return (await matchPrecache('/index.html')) || (await matchPrecache('/'));
    } catch (error) {
        return Response.error();
    }
}, {
    denylist: [/^\/api/],
});

registerRoute(navigationRoute);

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