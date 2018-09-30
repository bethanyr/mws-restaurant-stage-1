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
    dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').get(parseInt(id));
    }).then(restaurant => callback(null, restaurant))
    .catch(error => callback(error, null));
  }

  static updateRestaurantById(id, update) {
    
  }
  /**
   * Fetch reviews for a restaurant by restaurant ID.
   */
  static fetchReviewsById(restaurantId, callback) {
    if (!restaurantId) {
      return
    }
    dbPromise.then(db => {
      let tx = db.transaction('reviews')
      let store = tx.objectStore('reviews')
      let index = store.index('by-restaurant-id');
      return index.getAll(parseInt(restaurantId));
      // return index.get(parseInt(restaurantId));
    }).then(reviews => {
      callback(null, reviews);
    })
    .catch(error => callback(error, null));
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
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
   * Add New Restaurant Review
   */
  static saveRestaurantReview(review) {
    dbPromise.then(db => {
      let tx =  db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').put(review);
      return tx.complete;
    })
    // store a copy in the offline db to be synced by serviceworker  
    dbPromise.then(db => {
      let tx = db.transaction('offlineUpdates', 'readwrite');
      tx.objectStore('offlineUpdates').put({
        createdAt: (new Date).getTime(),
        type: 'addReview',
        data: review
      })
      return tx.complete;
    })   
  }

  static sendRestaurantReview(review) {
    const reviewUrl = "http://localhost:1337/reviews";
    fetch(reviewUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(review),
    }).then(response => {
      if (response.status === 201) {
          return;
        } else
          throw new Error('Unable to add new Review');
    }).catch(error => {
        console.error('An error occured adding a new restaurant review', error);
    })
  }
  
  /**
   *  Update Favorite flag for restaurant
   */
  static updateFavorite(restaurantId, isFavorite) {    
    // update indexedDb copy with favorite data
    dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').get(parseInt(restaurantId))
    }).then(restaurant => {
      restaurant["is_favorite"] = restaurant["is_favorite"].toString() === "true" ? "false" : "true";
      dbPromise.then(db => {
        let tx = db.transaction('restaurants', 'readwrite')
        tx.objectStore('restaurants').put(restaurant);
        return tx.complete;
      })
    })
    // add a copy to the offlineUpdates indexeddb store
    // if the serviceworker is online it will sync this data,
    // otherwise it will sync data next time it is online, using background sync   
    dbPromise.then(db => {
      let tx = db.transaction('offlineUpdates', 'readwrite');
      tx.objectStore('offlineUpdates').put({
        createdAt: (new Date).getTime(),
        type: 'updateRestaurant',
        data: {
          restaurantId: restaurantId,
          isFavorite: isFavorite
        }
      })
      return tx.complete;
    })  
  }

  static sendFavorite(restaurantId, isFavorite) {
    let updateRequest = new Request(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {method: 'PUT'});
    fetch(updateRequest)
      .then(response => {
        if (response.status === 200) {
          return;
        } else
          throw new Error('Unable to update Favorite');
      }).catch(error => {
        console.error('An error occured adding the restaurant to Favorite', error);
      })
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
   * Formatted Review date
   */

  static reviewDate(review) {
    let rDate = new Date(review.updatedAt);
    return (rDate.toDateString());
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

  static syncOffline() {
    let dbProm = DBHelper.openDB();
    dbProm.then(db => {
      let tx = db.transaction('offlineUpdates', 'readwrite');
      let offlineStore = tx.objectStore('offlineUpdates');
      let updateFavoriteUrl;
    
      offlineStore.openCursor().then(function syncTransaction(cursor) {
        if (!cursor) return;
        let updateRequest;
        let data = cursor.value.data;
        if (cursor.value.type === 'updateRestaurant') {
          DBHelper.sendFavorite(data.restaurantId, data.isFavorite);
        }
        if (cursor.value.type === 'addReview') {
          DBHelper.sendRestaurantReview(data);
        }
        cursor.delete();
        return cursor.continue().then(syncTransaction);
      }).then(() => {
        console.log('finished with updates');
      })
    })
  }
  
}

