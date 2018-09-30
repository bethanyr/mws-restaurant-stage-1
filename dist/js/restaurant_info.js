let restaurant;
var newMap;

initializePage = () => {
  dbPromise = DBHelper.openDB();
  initMap();
}

navigator.serviceWorker.addEventListener('message', event => {
  initializePage();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  
    DBHelper.fetchReviewsById(id, (error, reviews) => {
      self.restaurant.reviews = reviews;
      if (!reviews) {
        return;
      }
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('favorite');
  favorite.innerHTML = ""
  favorite.role="button"
  favorite.setAttribute('aria-pressed', restaurant.is_favorite);
  favorite.className = restaurant.is_favorite.toString() === "true" ? 'favorite active' : 'favorite';
  favorite.setAttribute('data-restaurant-id', restaurant.id);
  favorite.setAttribute('data-favorite', restaurant.is_favorite);
  
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  let imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  let alt = DBHelper.imageAltTextForRestaurant(restaurant);
  image.innerHTML = `<source type = "image/webp" srcset="${imgUrl.webp}"/><img src="${imgUrl.jpg}" alt="${alt}"/>`

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  setupModal();
}

/**
 * Add new review to HTML on the webpage
 */

 addNewReviewHtml = (review) => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
 }

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = DBHelper.reviewDate(review);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Setup ServiceWorker
 */
if (navigator.serviceWorker) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/serviceworker.js').then(function(registration) {
      if (registration.active) {
        // if serviceWorker has already been activated, a 'dbReady' event will
        // not fire, so need to go ahead and initialize the page.
        initializePage();
      }
      if (registration.sync) {  
        const modal = document.getElementById('review-modal');
        const saveBtn = document.getElementById('save-review');
        saveBtn.addEventListener('click', function(event) {
          let name = document.getElementById('name').value;
          let rating = document.getElementById('rating').selectedIndex;
          let comments = document.getElementById('comment').value;
          let restaurant_id = getParameterByName('id');
          let review = {
            restaurant_id: parseInt(restaurant_id),
            name: name,
            createdAt: Date.now(),
            rating: rating,
            comments: comments,
            updatedAt: Date.now()
          }
          DBHelper.saveRestaurantReview(review);
          if (!navigator.onLine) {
            alert('You are not connected to the network. Your review will be submitted the next time you are connected to th network.');
          }
          addNewReviewHtml(review);
          modal.style.display = "none";
          return registration.sync.register('review');
        });
        const favorite = document.getElementById('favorite');
        favorite.addEventListener('click', function(event) {
          restaurantId = event.target.getAttribute('data-restaurant-id');
          isFavorite = event.target.getAttribute('data-favorite');
          // set the updateFavorite to the opposite value of isFavorite
          let updateFavorite = (isFavorite.toString() === "true") ? "false" : "true";
          event.target.setAttribute('data-favorite', updateFavorite);
          event.target.classList.toggle('active');
          event.target.setAttribute('aria-pressed', updateFavorite);
          DBHelper.updateFavorite(restaurantId, updateFavorite);
          return registration.sync.register('favorite');
        });
      }
    }, function(e) {
      console.log('ServiceWorker registration failed, ', e);
    });
  });
}

setupModal = () => {
  // modal code based off of: https://www.w3schools.com/howto/howto_css_modals.asp
  // and udacity accessibility lesson 11: focus (modals and keyboard traps)
  // (from Udacity unit 2. Accessible & Responsive Web Apps)

  const modal = document.getElementById('review-modal');
  const reviewBtn = document.getElementById('review-btn');
  const cancelBtn = document.getElementById('cancel-review');
  let focusedElementBeforeModal;
  
  reviewBtn.addEventListener('click', function(event) {
    focusedElementBeforeModal = document.activeElement;
    modal.style.display = "block";
    modal.addEventListener('keydown', trapKey);
  });

  let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  let focusableElements = modal.querySelectorAll(focusableElementsString);
  // Convert NodeList to Array
  focusableElements = Array.prototype.slice.call(focusableElements);


  let firstTabStop = focusableElements[0];
  let lastTabStop = focusableElements[focusableElements.length - 1];

  firstTabStop.focus();

  trapKey = (e) => {
    // Check for TAB key press
    if (e.keyCode === 9) {

      // SHIFT + TAB
      if (e.shiftKey) {
        if (document.activeElement === firstTabStop) {
          e.preventDefault();
          lastTabStop.focus();
        }

      // TAB
      } else {
        if (document.activeElement === lastTabStop) {
          e.preventDefault();
          firstTabStop.focus();
        }
      }
    }

    // ESCAPE
    if (e.keyCode === 27) {
      modal.style.display = "none";
      focusedElementBeforeModal.focus();

    }
  }

  cancelBtn.addEventListener('click', function(event) {
    modal.style.display = "none";
    focusedElementBeforeModal.focus();
  });

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
      focusedElementBeforeModal.focus();
    }
  })

}
