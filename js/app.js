import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { signOut, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;

/* CHECK LOGIN */
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        currentUser = user;
        loadTasks();
    }
});

/* LOGOUT */
window.logout = () => {
    signOut(auth);
    window.location.href = "index.html";
};

/* LOAD TASKS */
function loadTasks() {
    onSnapshot(collection(db, "tasks"), snap => {

        let tasks = [];

        snap.forEach(d => {
            let t = d.data();
            if (t.user === currentUser.uid) {
                tasks.push({ id: d.id, ...t });
            }
        });

        render(tasks);
    });
}

/* ADD TASK */
window.add = async () => {
    if (!taskInput.value.trim()) return;

    await addDoc(collection(db, "tasks"), {
        text: taskInput.value,
        completed: false,
        user: currentUser.uid
    });

    taskInput.value = "";
};

/* TOGGLE */
window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !completed
    });
};

/* DELETE */
window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

/* RENDER */
function render(tasks) {
    let html = "";

    tasks.forEach(t => {
        html += `
        <div class="task-card">
            <div class="task-text ${t.completed ? 'completed' : ''}">
                ${t.text}
            </div>

            <div class="task-actions">
                <button class="complete" onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button class="delete" onclick="del('${t.id}')">❌</button>
            </div>
        </div>`;
    });

    document.getElementById("grid").innerHTML = html;
}
