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
    }).then(function(db) {
      self.clients.claim();
      self.clients.matchAll().then(function(clients) {
        console.log('clients', clients);
        clients.forEach(function(client) {
          client.postMessage('dbReady');
        })    
      });
    })
  );
});

function createDB() {
  console.log('createdb');
  return idb.open('restaurant-db', 1, function(upgradeDB) {
    console.log('old version', upgradeDB.oldVersion);
    switch (upgradeDB.oldVersion) {
      case 0:
        let store = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        store.createIndex('by-neighborhood', 'neighborhood');
        store.createIndex('by-cuisine', 'cuisine_type');
    }
  })
}

function loadDB(db) {
  console.log('loaddb');
  const DATABASE_URL = 'http://localhost:1337/restaurants'
  fetch(DATABASE_URL).then(function(response) {
    return response.json();
  }).then(function(restaurants) {
      let tx = db.transaction('restaurants', 'readwrite');
      let store = tx.objectStore('restaurants');
      restaurants.forEach(function(restaurant) {
        store.put(restaurant);
      });
      return tx.complete;
  }).catch(function(err) {
    console.log('unable to fetch restaurants', err)
  })
}