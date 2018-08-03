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
    createDB()
  );
});

function createDB() {
  // put code to create restaurants db here
  return idb.open('restaurant-db', 1, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
      case 0:

      case 1:
        console.log('here');
        let store = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        store.createIndex('by-neighborhood', 'neighborhood');
        store.createIndex('by-cuisine', 'cuisine_type');
    }
    // load restaurant data into store
  })
}

function loadDB(dbPromise) {
  dbPromise.then(function(dbPromise) {
    let tx = db.transaction('restaurant', 'readwrite');
    let store = tx.objectStore('restaurant');
    restaurants.forEach(function(restaurant) {
      store.put(restaurant);
    });
    return tx.complete;
  });
}