import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { setDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* LOGIN */
window.login = async () => {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "app.html";
};

/* SIGNUP */
window.signup = async () => {
    let user = await createUserWithEmailAndPassword(auth, email.value, password.value);

    await setDoc(doc(db, "users", user.user.uid), {
        name: name.value,
        email: email.value
    });

    window.location.href = "index.html";
};

/* NAVIGATION */
window.goSignup = () => window.location.href = "signup.html";
window.goLogin = () => window.location.href = "index.html";
