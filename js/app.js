import { auth, db } from "./firebase.js";

import { 
  collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let allTasks = [];

/* LOGOUT */
window.logout = () => {
    signOut(auth);
    window.location.href = "index.html";
};

/* CHECK USER */
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        currentUser = user;
        loadTasks();
    }
});

/* LOAD TASKS */
function loadTasks() {
    onSnapshot(collection(db, "tasks"), snap => {
        allTasks = [];

        snap.forEach(d => {
            let t = d.data();
            if (t.user === currentUser.uid) {
                allTasks.push({ id: d.id, ...t });
            }
        });

        render(allTasks);
    });
}

/* ADD */
window.add = async () => {
    await addDoc(collection(db, "tasks"), {
        text: taskInput.value,
        date: new Date().toISOString().split("T")[0],
        completed: false,
        user: currentUser.uid
    });

    taskInput.value = "";
};

/* TOGGLE */
window.toggle = (id, c) => {
    updateDoc(doc(db, "tasks", id), { completed: !c });
};

/* DELETE */
window.del = (id) => deleteDoc(doc(db, "tasks", id));

/* RENDER */
function render(tasks) {
    let html = "";

    tasks.forEach(t => {
        html += `
        <div>
            ${t.text}
            <button onclick="toggle('${t.id}',${t.completed})">✔</button>
            <button onclick="del('${t.id}')">❌</button>
        </div>`;
    });

    grid.innerHTML = html;
}
