import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* CHECK USER */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
    } else {

        /* GET USER DATA */
        let docRef = doc(db, "users", user.uid);
        let snap = await getDoc(docRef);

        if (snap.exists()) {
            let data = snap.data();
            document.getElementById("username").innerText =
                "👤 Welcome " + data.name;
        }
    }
});

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
