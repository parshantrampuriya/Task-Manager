import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyA2qZmQSv7tJXmVQiGRJD6xO8MKQvGGQ6o",
  authDomain: "task-manager-c32bc.firebaseapp.com",
  projectId: "task-manager-c32bc",
  storageBucket: "task-manager-c32bc.firebasestorage.app",
  messagingSenderId: "686414095912",
  appId: "1:686414095912:web:158882cd292ccbaaccb71d",
  measurementId: "G-TLD8JJGETS"
};

/* INIT */
const app = initializeApp(firebaseConfig);

/* AUTH */
const auth = getAuth(app);

/* 🔥 VERY IMPORTANT FIX (REMEMBER LOGIN) */
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Login persistence enabled");
  })
  .catch((error) => {
    console.error("❌ Persistence error:", error);
  });

/* FIRESTORE */
const db = getFirestore(app);

export { auth, db };
