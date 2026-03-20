
window.goSignup = () => {
    window.location.href = "signup.html";
};
import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* LOGIN */
async function login() {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login Successful ✅");

        window.location.href = "app.html";

    } catch (error) {
        alert(error.message);
    }
}

/* CONNECT LOGIN BUTTON */
document.querySelector("button").addEventListener("click", login);

/* FORGOT PASSWORD */
document.getElementById("forgotBtn").addEventListener("click", async () => {

    let email = document.getElementById("email").value;

    if (!email) {
        alert("Please enter your email first");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to your email 📩");

    } catch (error) {
        alert(error.message);
    }
});
