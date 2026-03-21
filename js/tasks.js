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
window.goGoals = () => window.location.href = "goals.html"; // 🔥 ADDED
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR (FIXED USING active) */
window.toggleSidebar = function () {

    let sidebar = document.getElementById("sidebar");

    if (sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
    } else {
        sidebar.classList.add("active");
    }
};

/* CLICK OUTSIDE TO CLOSE */
document.addEventListener("click", function(e) {

    let sidebar = document.getElementById("sidebar");
    let menuBtn = document.querySelector(".menu-btn");

    if (!sidebar || !menuBtn) return;

    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});

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

/* LOAD TASKS */
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

/* ADD TASK */
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

/* SWITCH TAB */
window.switchTab = (tab, e) => {
    currentTab = tab;

    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (e) e.target.classList.add("active");

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

            let dayName = new Date(date).toLocaleDateString("en-US", {
                weekday: "long"
            });

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
                        <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                        <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                        <button onclick="del('${t.id}')">❌</button>
                    </div>
                </li>`;
            });

            html += `</ol></div>`;
        });

    document.getElementById("taskContainer").innerHTML = html;
}

/* ACTIONS */
window.toggle = (id, c) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !c
    });
};

window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

window.editTask = (id, text) => {
    let newText = prompt("Edit task", text);
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
