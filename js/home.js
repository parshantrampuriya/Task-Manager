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

/* LOAD */
function loadTasks(uid) {
    onSnapshot(collection(db, "tasks"), snap => {

        let tasks = [];

        snap.forEach(d => {
            let t = d.data();
            if (t.user === uid) tasks.push({ id: d.id, ...t });
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

    let percent = total ? Math.round((completed/total)*100) : 0;

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
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                <button onclick="del('${t.id}')">❌</button>
            </div>
        </li>`;
    });

    html += `</ol>`;

    document.getElementById("homeContent").innerHTML = html;
}

/* ACTIONS */
window.toggle = (id,c)=> updateDoc(doc(db,"tasks",id),{completed:!c});
window.del = (id)=> deleteDoc(doc(db,"tasks",id));
window.editTask = (id,text)=>{
    let t = prompt("Edit task",text);
    if(t) updateDoc(doc(db,"tasks",id),{text:t});
};

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
/* MENU TOGGLE */
window.toggleMenu = () => {
    let d = document.getElementById("dropdown");
    d.style.display = d.style.display === "block" ? "none" : "block";
};

/* NAVIGATION */
window.goProfile = () => {
    window.location.href = "profile.html";
};
