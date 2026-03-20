import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* LOGIN */
document.getElementById("loginBtn").addEventListener("click", async () => {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login Successful ✅");
        window.location.href = "app.html";

    } catch (error) {
        alert(error.message);
    }
});

/* GO TO SIGNUP */
document.getElementById("goSignupBtn").addEventListener("click", () => {
    window.location.href = "signup.html";
});

/* OPEN POPUP */
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
