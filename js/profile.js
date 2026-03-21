import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* STORAGE */
const storage = getStorage();

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

    let refDoc = doc(db, "users", user.uid);
    let snap = await getDoc(refDoc);

    if (snap.exists()) {
        let data = snap.data();

        document.getElementById("name").value = data.name || "";
        document.getElementById("email").value = user.email;
        document.getElementById("gender").value = data.gender || "Male";
        document.getElementById("dob").value = data.dob || "";

        /* LOAD IMAGE */
        if (data.photoURL) {
            document.getElementById("profileImg").src = data.photoURL;
        }
    }
});

/* SAVE PROFILE */
window.saveProfile = async () => {

    let user = auth.currentUser;

    let name = document.getElementById("name").value;
    let gender = document.getElementById("gender").value;
    let dob = document.getElementById("dob").value;
    let newPassword = document.getElementById("password").value;

    /* UPDATE FIRESTORE */
    await updateDoc(doc(db, "users", user.uid), {
        name, gender, dob
    });

    /* PASSWORD CHANGE (OPTIONAL) */
    if (newPassword) {
        try {
            await updatePassword(user, newPassword);
            alert("Password Updated ✅");
        } catch {
            alert("Please login again to change password");
        }
    }

    alert("Profile Updated ✅");
};

/* IMAGE UPLOAD */
window.uploadImage = async () => {

    let file = document.getElementById("imgInput").files[0];
    let user = auth.currentUser;

    if (!file) {
        alert("Please select an image");
        return;
    }

    try {
        let storageRef = ref(storage, "profileImages/" + user.uid);

        await uploadBytes(storageRef, file);

        let url = await getDownloadURL(storageRef);

        /* SAVE URL IN FIRESTORE */
        await updateDoc(doc(db, "users", user.uid), {
            photoURL: url
        });

        /* UPDATE UI */
        document.getElementById("profileImg").src = url;

        alert("Image uploaded successfully ✅");

    } catch (error) {
        alert(error.message);
    }
};

/* PASSWORD TOGGLE */
window.togglePassword = () => {
    let p = document.getElementById("password");
    p.type = p.type === "password" ? "text" : "password";
};

/* RESET PASSWORD */
window.resetPassword = async () => {
    await sendPasswordResetEmail(auth, auth.currentUser.email);
    alert("Reset link sent 📩");
};

/* PASSWORD STRENGTH */
document.getElementById("password").addEventListener("input", () => {

    let p = document.getElementById("password").value;
    let bar = document.getElementById("strengthBar");
    let text = document.getElementById("strengthText");

    let s = 0;

    if (p.length >= 6) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;

    if (!p) {
        bar.style.width = "0%";
        text.innerText = "";
        return;
    }

    if (s <= 1) {
        bar.style.width = "25%";
        bar.style.background = "red";
        text.innerText = "Weak Password";
    }
    else if (s === 2) {
        bar.style.width = "50%";
        bar.style.background = "orange";
        text.innerText = "Medium Password";
    }
    else {
        bar.style.width = "100%";
        bar.style.background = "lime";
        text.innerText = "Strong Password";
    }
});

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
/* IMAGE PREVIEW BEFORE UPLOAD */
document.getElementById("imgInput").addEventListener("change", () => {

    let file = document.getElementById("imgInput").files[0];

    if (!file) return;

    let reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById("profileImg").src = e.target.result;
    };

    reader.readAsDataURL(file);
});
