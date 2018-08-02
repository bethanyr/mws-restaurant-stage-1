// import idb from 'idb';

class DBHelper {
  
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    console.log('in openDatabase');
    return idb.open('restaurant-db', 1, function(upgradeDB) {
      let store = upgradeDB.createObjectStore('restaurant', { keyPath: 'id' });
      store.createIndex('by-neighborhood', 'neighborhood');
      store.createIndex('by-cuisine', 'cuisine_type');
    })
  }
  static fetchRestaurantsFromApi() {
    
    fetch(`${DBHelper.DATABASE_URL}`)
      // .then(response => console.log(response))
      .then(response => response.json())
  }
  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    
    fetch(`${DBHelper.DATABASE_URL}`)
      // .then(response => console.log(response))
      .then(response => response.json())
      .then(function(restaurants) {
        // loop through each restaurant and add it to the store - do we need to check it exists?
        // load the items into index db
        let dbPromise = DBHelper.openDatabase();
        dbPromise.then(function(db) {
          let tx = db.transaction('restaurant', 'readwrite');
          let store = tx.objectStore('restaurant');
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });
          return tx.complete;
        });
        return restaurants;
      })
      // let dbPromise = DBHelper.openDatabase();
      // dbPromise.then(function(db) {
      //   let tx = db.transaction('restaurants');
      //   let restaurantStore = tx.objectStore('restaurant');
      //   return restaurantStore.getAll();
      // })
      // .then(restaurants => callback(null, restaurants))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    fetch(`${DBHelper.DATABASE_URL}/${id}`)
      .then(function(response) {
        return response.json();
      })
      .then(restaurant => callback(null, restaurant))
      .catch(error => callback(error, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    
    // return (`/dist/img/${restaurant.photograph}.jpg`);
    let imgName = (restaurant.photograph ? restaurant.photograph : restaurant.id)
    
    return { webp: `/dist/images/${imgName}.webp`,
        jpg: `/dist/img/${imgName}.jpg`
    };
  }

  /**
   * Restaurant image alt text.
   */
  static imageAltTextForRestaurant(restaurant) {
    return (`Picture of ${restaurant.name} restaurant`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

}
