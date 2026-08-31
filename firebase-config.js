/* BUNKER ONLINE — подключение Firebase (проект bunker-game-9c600) */
const firebaseConfig = {
  apiKey: "AIzaSyCB6_CagfK18XXeEpi0E1yHT3OXrPkb9Xo",
  authDomain: "bunker-game-9c600.firebaseapp.com",
  databaseURL: "https://bunker-game-9c600-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bunker-game-9c600",
  storageBucket: "bunker-game-9c600.firebasestorage.app",
  messagingSenderId: "426208884322",
  appId: "1:426208884322:web:c4749976e5e7fe1fdec33b"
};

window.FB_OK = false;
try {
  if (window.firebase && String(firebaseConfig.apiKey).indexOf('PASTE') === -1) {
    firebase.initializeApp(firebaseConfig);
    window.FB_OK = true;
  }
} catch (e) { 
  window.FB_OK = false; 
  console.error('Firebase init error:', e);
}

console.log('BUNKER: firebase =', typeof window.firebase, '| FB_OK =', window.FB_OK);