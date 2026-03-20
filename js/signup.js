import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* SIGNUP */
async function signup() {

    let name = document.getElementById("name").value;
    let gender = document.getElementById("gender").value;
    let dob = document.getElementById("dob").value;

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    let emailError = document.getElementById("emailError");
    let passwordError = document.getElementById("passwordError");

    emailError.innerText = "";
    passwordError.innerText = "";

    /* VALIDATION */
    if (!email.includes("@")) {
        emailError.innerText = "Enter valid email";
        return;
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) {
        passwordError.innerText = "Password too weak";
        return;
    }

    try {
        /* CREATE USER */
        let userCred = await createUserWithEmailAndPassword(auth, email, password);

        /* STORE DATA IN FIRESTORE */
        await setDoc(doc(db, "users", userCred.user.uid), {
            name: name,
            gender: gender,
            dob: dob,
            email: email
        });

        /* EMAIL VERIFY */
        await sendEmailVerification(userCred.user);

        alert("Account created! Verify email 📩");

    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            emailError.innerText = "Email already exists";
        } else {
            alert(error.message);
        }
    }
}

/* BUTTON */
document.getElementById("signupBtn").addEventListener("click", signup);

/* LOGIN REDIRECT */
document.getElementById("goLoginBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});

/* PASSWORD STRENGTH BAR */
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
    else {
        bar.style.width = "100%";
        bar.style.background = "lime";
        text.innerText = "Strong Password";
    }
});
