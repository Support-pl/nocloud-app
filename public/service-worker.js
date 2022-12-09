
workbox.core.setCacheNameDetails({
	prefix: "cloudApp"
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		console.log('trying to skip waiting')
		self.skipWaiting()
	}
});

self.addEventListener('install', (event) => {
	self.skipWaiting()
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
  event.waitUntil(caches.keys().then((cacheNames) =>
    Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
  ))
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
