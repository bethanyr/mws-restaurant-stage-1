let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];
var dbPromise;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
});

navigator.serviceWorker.addEventListener('message', event => {
  if (event.data === 'dbReady') {
    initializePage();
  }
});

initializePage = () => {
  dbPromise = DBHelper.openDB();
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYmV0aGFueXIiLCJhIjoiY2ppYjM0Y3FlMTVqcDNxczk1bDU5bW1jYSJ9.8fLG6qTNfqiq46JEkJFUtQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('picture');
  image.className = 'restaurant-img';
  let imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  let alt = DBHelper.imageAltTextForRestaurant(restaurant);
  image.innerHTML = `<source type = "image/webp" srcset="${imgUrl.webp}"/><img src="${imgUrl.jpg}" alt="${alt}"/>`
  
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  const favorite = document.createElement('a');
  favorite.innerHTML = ""
  favorite.role="button"
  favorite.setAttribute('aria-pressed', restaurant.is_favorite.toString());
  favorite.className = restaurant.is_favorite.toString() === "true" ? 'favorite active' : 'favorite';
  favorite.setAttribute('data-restaurant-id', restaurant.id);
  favorite.setAttribute('data-favorite', restaurant.is_favorite.toString());
  favorite.addEventListener('click', function(event) {
    restaurantId = event.target.getAttribute('data-restaurant-id');
    isFavorite = event.target.getAttribute('data-favorite');
    // set the updateFavorite to the opposite value of isFavorite
    let updateFavorite = (isFavorite.toString() === "true") ? "false" : "true";
    event.target.setAttribute('data-favorite', updateFavorite);
    event.target.classList.toggle('active');
    event.target.setAttribute('aria-pressed', updateFavorite);
    DBHelper.updateFavorite(restaurantId, updateFavorite);
  });
  li.append(favorite);
  return li
}


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
} 

favoriteSvg = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-255 459 144 144"><circle fill="#3F51B5" cx="-183" cy="531" r="72"/><path fill="#FFF" d="M-199.3 585.2c-1.6 0-3.3-.7-4.5-2-2.3-2.4-2.2-6.4.3-8.7l25-23.5c1-1 2.7-1.7 4.2-1.7h15c4.6 0 8.5-4 8.5-8.6v-32.2c0-4.8-4-8.7-8.6-8.7h-47c-5 0-8.8 4-8.8 8.7v32.2c0 4.8 3.7 8.6 8.5 8.6h5c3.4 0 6 2.8 6 6.2 0 3.4-2.6 6.2-6 6.2h-5c-11.5 0-21-9.4-21-21v-32.2c0-11.6 9.6-21 21.3-21h47c11.6 0 21 9.4 21 21v32.2c0 11.6-9.4 21-21 21h-12.4l-23.3 21.8c-1.2 1-2.8 1.7-4.3 1.7z"/></svg>`
}

/**
 * Setup ServiceWorker
 */
if (navigator.serviceWorker) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/serviceworker.js').then(function(registration) {
      if (registration.active) {
        initializePage();
      }
    }, function(e) {
      console.log('ServiceWorker registration failed, ', e);
    });
  });
}
