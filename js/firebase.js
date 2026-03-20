import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2qZmQSv7tJXmVQiGRJD6xO8MKQvGGQ6o",
  authDomain: "task-manager-c32bc.firebaseapp.com",
  projectId: "task-manager-c32bc",
  storageBucket: "task-manager-c32bc.firebasestorage.app",
  messagingSenderId: "686414095912",
  appId: "1:686414095912:web:158882cd292ccbaaccb71d",
  measurementId: "G-TLD8JJGETS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
