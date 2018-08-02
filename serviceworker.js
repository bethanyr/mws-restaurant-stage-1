const staticCache = 'restaurant-cache-v1';

const filesToCache = [
  'dist/js/main.js',
  'dist/js/dbhelper.js',
  'dist/js/restaurant_info.js',
  'dist/styles.css',
  '/',
  'restaurant.html'
  
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCache).then(function(cache) {
      return cache.addAll(filesToCache);
    }) 
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(e) {
      console.log('An error occured fetching cache', e);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    createDB()
  );
});

function createDB() {
  // put code to create restaurants db here
}