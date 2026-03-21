import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* GLOBAL */
let currentUser = null;
let tasks = [];
let currentTab = "pending";

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

    currentUser = user;

    let docRef = doc(db, "users", user.uid);
    let snap = await getDoc(docRef);

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks();
});

/* LOAD */
function loadTasks() {
    onSnapshot(collection(db, "tasks"), snap => {

        tasks = [];

        snap.forEach(d => {
            let t = d.data();
            if (t.user === currentUser.uid) {
                tasks.push({ id: d.id, ...t });
            }
        });

        render();
    });
}

/* ADD */
window.addTask = async () => {

    let text = document.getElementById("taskInput").value;
    let date = document.getElementById("dateInput").value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text: text,
        date: date,
        completed: false,
        user: currentUser.uid
    });

    document.getElementById("taskInput").value = "";
};

/* TAB */
window.switchTab = (tab) => {
    currentTab = tab;
    render();
};

/* RENDER */
function render() {

    let today = new Date().toISOString().split("T")[0];
    let search = document.getElementById("searchInput").value.toLowerCase();

    let filtered = tasks.filter(t =>
        t.text.toLowerCase().includes(search)
    );

    if (currentTab === "pending") {
        filtered = filtered.filter(t => !t.completed && t.date >= today);
    }

    if (currentTab === "due") {
        filtered = filtered.filter(t => !t.completed && t.date < today);
    }

    if (currentTab === "completed") {
        filtered = filtered.filter(t => t.completed);
    }

    let grouped = {};

    filtered.forEach(t => {
        if (!grouped[t.date]) grouped[t.date] = [];
        grouped[t.date].push(t);
    });

    let html = "";

    Object.keys(grouped)
    .sort((a,b)=> new Date(a)-new Date(b))
    .forEach(date => {

        let dayName = new Date(date).toLocaleDateString("en-US",{weekday:"long"});

        html += `
        <div class="date-group">
            <h3>📅 ${dayName} (${date})</h3>
            <ol class="task-list">
        `;

        grouped[date].forEach(t => {
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

        html += `</ol></div>`;
    });

    document.getElementById("taskContainer").innerHTML = html;
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

/* SEARCH */
document.getElementById("searchInput").addEventListener("input", render);

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
