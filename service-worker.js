var version = 'v003::';
var cacheList = [
			'/bus-schedule/schedule.html',
			'/bus-schedule/js/bootstrap.min.js',
			'/bus-schedule/js/jquery-3.4.1.min.js',
			'/bus-schedule/css/bootstrap.min.css',
			'/bus-schedule/css/bootstrap-theme.min.css'
			];
self.addEventListener('install', function(event) {
	event.waitUntil(caches.open(version + 'data').then(function (cache) {
		return cache.addAll(cacheList);
	}).then(function () {
		console.log('Installation completed.');
	}));
});
self.addEventListener('fetch', function(event) {
	if (event.request.method != 'GET' || !(event.request.url in cacheList)) {
		console.log('Fetch event ignored');
		return;
	}

	event.respondWith(caches.match(event.request).then(function(cached) {
		var networked = fetch(event.request).then(fetchedFromNetwork, unableToResolve);
		return cached || networked;

		function fetchedFromNetwork(response) {
			var cacheCopy = response.clone();
			caches.open(version + 'pages').then(function add(cache) {
				cache.put(event.request, cacheCopy);
			}).then(function() {
				console.log('Fetch response stored in cache.', event.request.url);
			});
			return response;
		}

		function unableToResolve() {
			return new Response('<h1>Service Unavailable (Cache failed)</h1>', {
				status: 503,
				statusText: 'Service Unavailable',
				headers: new Headers({
					'Content-Type': 'text/html'
				})
			});
		}
	}));
});
self.addEventListener('activate', function(event) {
	event.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (key) {
			return !key.startsWith(version);
		}).map(function (key) {
			return caches.delete(key);
		}));
	}).then(function() {
		console.log('Activate completed.')
	}));
});