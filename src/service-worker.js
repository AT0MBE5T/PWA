import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

const handler = createHandlerBoundToURL('/');
const navigationRoute = new NavigationRoute(handler, {
    denylist: [/^\/api/], 
});

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