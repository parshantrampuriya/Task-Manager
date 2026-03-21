import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* NAVIGATION */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR TOGGLE */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
};

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    let docRef = doc(db, "users", user.uid);
    let snap = await getDoc(docRef);

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks(user.uid);
});

/* LOAD TASKS */
function loadTasks(uid) {
    onSnapshot(collection(db, "tasks"), snap => {

        let tasks = [];

        snap.forEach(d => {
            let t = d.data();
            if (t.user === uid) {
                tasks.push({ id: d.id, ...t });
            }
        });

        renderHome(tasks);
    });
}

/* HOME RENDER */
function renderHome(tasks) {

    let today = new Date().toISOString().split("T")[0];

    let todayTasks = tasks.filter(t => t.date === today);

    let completed = todayTasks.filter(t => t.completed).length;
    let total = todayTasks.length;

    let percent = total ? Math.round((completed / total) * 100) : 0;

    let html = `
        <h2>📅 Today's Tasks</h2>

        <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
        </div>

        <p>${completed} / ${total} completed</p>

        <ol class="task-list">
    `;

    todayTasks.forEach(t => {
        html += `
        <li class="task-item">
            <span>${t.text}</span>

            <div class="task-actions">
                <button onclick="toggle('${t.id}', ${t.completed})">✔</button>
                <button onclick="editTask('${t.id}', '${t.text}')">✏️</button>
                <button onclick="del('${t.id}')">❌</button>
            </div>
        </li>`;
    });

    html += `</ol>`;

    document.getElementById("homeContent").innerHTML = html;
}

/* ACTIONS */
window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !completed
    });
};

window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

window.editTask = (id, oldText) => {
    let newText = prompt("Edit task", oldText);
    if (newText) {
        updateDoc(doc(db, "tasks", id), {
            text: newText
        });
    }
};

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
