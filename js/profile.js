import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* NAV */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
};

/* LOAD USER */
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

        if (data.img) {
            document.getElementById("profileImg").src = data.img;
        }
    }
});

/* SAVE */
window.saveProfile = async () => {

    let user = auth.currentUser;

    let name = document.getElementById("name").value;
    let gender = document.getElementById("gender").value;
    let dob = document.getElementById("dob").value;

    /* IMAGE */
    let file = document.getElementById("imgUpload").files[0];
    let imgBase64 = null;

    if (file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            imgBase64 = reader.result;

            await updateDoc(doc(db, "users", user.uid), {
                name, gender, dob, img: imgBase64
            });

            alert("Profile Updated ✅");
        };

    } else {
        await updateDoc(doc(db, "users", user.uid), {
            name, gender, dob
        });

        alert("Profile Updated ✅");
    }
};

/* PASSWORD SHOW */
window.togglePassword = () => {
    let p = document.getElementById("password");

    p.type = p.type === "password" ? "text" : "password";
};

/* RESET PASSWORD */
window.resetPassword = async () => {

    let email = auth.currentUser.email;

    await sendPasswordResetEmail(auth, email);

    alert("Reset link sent 📩");
};

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
