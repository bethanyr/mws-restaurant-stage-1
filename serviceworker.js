self.importScripts('dist/js/vendor/idb.js');

const staticCache = 'restaurant-cache-v1';

const filesToCache = [
  'dist/js/main.js',
  'dist/js/dbhelper.js',
  'dist/js/restaurant_info.js',
  'dist/styles.css',
  'dist/js/vendor/idb.js',
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
    createDB().then(function(db) {
      loadDB(db);
    })
  );
});

function createDB() {
  return idb.open('restaurant-db', 1, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
      case 0:

      case 1:
        let store = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        store.createIndex('by-neighborhood', 'neighborhood');
        store.createIndex('by-cuisine', 'cuisine_type');
    }
  })
}

function loadDB(dbPromise) {
  const DATABASE_URL = 'http://localhost:1337/restaurants'
  fetch(DATABASE_URL).then(function(response) {
    return response.json();
  }).then(function(restaurants) {
    let tx = dbPromise.transaction('restaurants', 'readwrite');
    let store = tx.objectStore('restaurants');
    restaurants.forEach(function(restaurant) {
      store.put(restaurant);
    });
    return tx.complete;
  })
}