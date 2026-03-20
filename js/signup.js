import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* SIGNUP */
async function signup() {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let emailError = document.getElementById("emailError");
    let passwordError = document.getElementById("passwordError");

    emailError.innerText = "";
    passwordError.innerText = "";

    if (!email.includes("@")) {
        emailError.innerText = "Please enter valid email";
        return;
    }

    if (password.length < 6) {
        passwordError.innerText = "Weak password";
        return;
    }

    try {
        let userCred = await createUserWithEmailAndPassword(auth, email, password);

        /* 🔥 SEND VERIFICATION EMAIL */
        await sendEmailVerification(userCred.user);

        alert("Verification email sent! Please check your inbox 📩");

    } catch (error) {

        if (error.code === "auth/email-already-in-use") {
            emailError.innerText = "Email already exists";
        } else {
            alert(error.message);
        }
    }
}

/* BUTTON CONNECT */
document.getElementById("signupBtn").addEventListener("click", signup);
