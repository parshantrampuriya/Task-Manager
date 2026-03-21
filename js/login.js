import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* LOGIN */
document.getElementById("loginBtn").addEventListener("click", async () => {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);

        /* 🔥 SHOW SUCCESS POPUP */
        document.getElementById("successPopup").style.display = "flex";

        /* 🔥 AUTO REDIRECT AFTER 1 SECOND */
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);

    } catch (error) {
        alert(error.message);
    }
});

/* GO TO SIGNUP */
document.getElementById("goSignupBtn").addEventListener("click", () => {
    window.location.href = "signup.html";
});

/* OPEN FORGOT PASSWORD POPUP */
document.getElementById("forgotBtn").addEventListener("click", () => {
    document.getElementById("forgotPopup").style.display = "flex";
});

/* CLOSE POPUP */
document.getElementById("closePopup").addEventListener("click", () => {
    document.getElementById("forgotPopup").style.display = "none";
});

/* SEND RESET LINK */
document.getElementById("resetBtn").addEventListener("click", async () => {

    let email = document.getElementById("resetEmail").value;

    if (!email) {
        alert("Please enter your email");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);

        alert("Reset link sent to your email 📩");

        document.getElementById("forgotPopup").style.display = "none";

    } catch (error) {
        alert(error.message);
    }
});
