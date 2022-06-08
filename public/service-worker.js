
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
	skipWaiting()
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
