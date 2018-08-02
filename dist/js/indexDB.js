import idb from 'idb';

let dbPromise = idb.open('restaurant-db', 1, function(upgradeDB) {
  switch(upgradeDB.oldVersion) {
      case 0:
        let keyValStore = upgradeDB.createObjectStore('restaurant', { keyPath: 'id' });
  }
})
