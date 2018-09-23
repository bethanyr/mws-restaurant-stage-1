self.importScripts('dist/js/vendor/idb.js');

const staticCache = 'restaurant-cache-v1';
const imgCache = 'restaurant-img-cache-v1';

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
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/dist/images/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(e) {
      console.log('An error occured fetching cache', e);
    })
  );

  // check the URLs for the api calls to the server
  // to update the favorites --> update the indexeddb version of the restaurant
  // and if it's offline then add the record to a store of updatest that need to happen to the 
  // server
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    createDB().then(function(db) {
      loadDB(db);
    }).then(function(db) {
      self.clients.claim();
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage('dbReady');
        })    
      });
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/.jpg$|.webp$/, '');

  return caches.open(imgCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function createDB() {
  return idb.open('restaurant-db', 2, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
      case 0:
        let store = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        store.createIndex('by-neighborhood', 'neighborhood');
        store.createIndex('by-cuisine', 'cuisine_type');
      case 1:
        let reviewStore = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
        reviewStore.createIndex('by-restaurant-id', 'restaurant_id');
    }
  })
}

function loadDB(db) {
  loadRestaurants(db);
  loadReviews(db);
}

function loadRestaurants(db) {
  const RESTAURANTS_URL = 'http://localhost:1337/restaurants'
  fetch(RESTAURANTS_URL).then(function(response) {
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

function loadReviews(db) {
  const REVIEWS_URL = 'http://localhost:1337/reviews'
  fetch(REVIEWS_URL).then(function(response) {
    return response.json();
  }).then(function(reviews) {
      let tx = db.transaction('reviews', 'readwrite');
      let store = tx.objectStore('reviews');
      reviews.forEach(function(review) {
        store.put(review);
      });
      return tx.complete;
  }).catch(function(err) {
    console.log('unable to fetch reviews', err)
  })
}