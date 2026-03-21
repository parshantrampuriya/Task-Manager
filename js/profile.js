import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* NAVIGATION */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
};

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    let ref = doc(db, "users", user.uid);
    let snap = await getDoc(ref);

    if (snap.exists()) {
        let data = snap.data();

        document.getElementById("name").value = data.name || "";
        document.getElementById("email").value = user.email;
        document.getElementById("gender").value = data.gender || "Male";
        document.getElementById("dob").value = data.dob || "";
    }
});

/* SAVE */
window.saveProfile = async () => {

    let user = auth.currentUser;

    let name = document.getElementById("name").value;
    let gender = document.getElementById("gender").value;
    let dob = document.getElementById("dob").value;

    await updateDoc(doc(db, "users", user.uid), {
        name,
        gender,
        dob
    });

    alert("Profile Updated ✅");
};

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
