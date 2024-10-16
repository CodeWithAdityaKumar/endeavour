import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6ihCz_Je3LCJkvEBymq7vKAcPK-WEk54",
    authDomain: "endeavour-5122a.firebaseapp.com",
    databaseURL: "https://endeavour-5122a-default-rtdb.firebaseio.com",
    projectId: "endeavour-5122a",
    storageBucket: "endeavour-5122a.appspot.com",
    messagingSenderId: "97533262842",
    appId: "1:97533262842:web:cb496491fc670d131d8243",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { auth, app, firebaseConfig, db, storage, onAuthStateChanged };
