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
document.getElementById("goLoginBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});
/* PASSWORD STRENGTH CHECK */
document.getElementById("password").addEventListener("input", () => {

    let password = document.getElementById("password").value;
    let bar = document.getElementById("strengthBar");
    let text = document.getElementById("strengthText");

    let strength = 0;

    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) {
        bar.style.width = "25%";
        bar.style.background = "red";
        text.innerText = "Weak Password";
    }
    else if (strength == 2) {
        bar.style.width = "50%";
        bar.style.background = "orange";
        text.innerText = "Medium Password";
    }
    else if (strength >= 3) {
        bar.style.width = "100%";
        bar.style.background = "lime";
        text.innerText = "Strong Password";
    }
});
if (strength <= 1) {
    passwordError.innerText = "Password too weak";
    return;
}
