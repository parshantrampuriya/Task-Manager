import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* NAV */
window.goLogin = () => {
    window.location.href = "index.html";
};

/* SIGNUP */
window.signup = async () => {

    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    let emailError = document.getElementById("emailError");
    let passwordError = document.getElementById("passwordError");

    emailError.innerText = "";
    passwordError.innerText = "";

    /* EMAIL VALIDATION */
    if (!email.includes("@")) {
        emailError.innerText = "Please enter valid email";
        return;
    }

    /* PASSWORD VALIDATION */
    if (password.length < 6) {
        passwordError.innerText = "Weak password (min 6 characters)";
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);

        /* SHOW OTP BOX (SIMULATED) */
        document.getElementById("otpBox").style.display = "block";

    } catch (error) {

        if (error.code === "auth/email-already-in-use") {
            emailError.innerText = "This email is already in use";
        } else {
            alert(error.message);
        }
    }
};

/* OTP VERIFY (DUMMY) */
window.verifyOTP = () => {
    alert("Account Verified ✅");
    window.location.href = "index.html";
};
document.getElementById("signupBtn").addEventListener("click", signup);
