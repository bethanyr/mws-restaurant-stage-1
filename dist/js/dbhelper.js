/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openDB() {
    return idb.open('restaurant-db');
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    console.log('fetchRestaurants');
    // let dbPromise = idb.open('restaurant-db');
    dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').getAll();
    }).then(function(restaurants) {
      callback(null, restaurants);
    }).catch(function(err) {
      const error = (`Request failed. Error info: ${err}`);
      callback(error, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    // let dbPromise = idb.open('restaurant-db');
    dbPromise.then(db => {
      // return db.transaction('restaurants').objectStore('restaurants').getAll();
      console.log('id', id);
      return db.transaction('restaurants').objectStore('restaurants').get(parseInt(id));
    }).then(function(restaurant) {
        console.log('restaurant', restaurant);
        callback(null, restaurant);
      }).catch(error => callback(error, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    // let dbPromise = idb.open('restaurant-db');
    dbPromise.then(db => {
      let tx = db.transaction('restaurants')
      let store = tx.objectStore('restaurants')
      let index = store.index('by-cuisine');
      return index.get(cuisine);
    }).then(restaurants => callback(null, restaurants))
    .catch(error => callback(error, null));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // let dbPromise = idb.open('restaurant-db');
    dbPromise.then(db => {
      let tx = db.transaction('restaurants')
      let store = tx.objectStore('restaurants')
      let index = store.index('by-neighborhood');
      return index.get(neighborhood);
    }).then(restaurants => callback(null, restaurants))
    .catch(error => callback(error, null));
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

