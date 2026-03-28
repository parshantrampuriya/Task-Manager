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

/* MODAL STATE */
let currentTaskId = null;
let currentAction = null;

/* NAV */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goGoals = () => window.location.href = "goals.html";
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
};

/* CLICK OUTSIDE */
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

    let snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks();
});

/* 🔥 LOCAL DATE FUNCTION */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

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
        text,
        date: date || getToday(),
        completed: false,
        user: currentUser.uid
    });

    taskInput.value = "";
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

    let today = getToday(); // 🔥 FIXED HERE

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

    if (filtered.length === 0) {
        taskContainer.innerHTML = `
            <p style="text-align:center; margin-top:30px; color:#aaa;">
                😌 No tasks here<br><br>
                Stay consistent 🔥
            </p>
        `;
        return;
    }

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
                        <button onclick="openModal('edit','${t.id}','${t.text}')">✏️</button>
                        <button onclick="openModal('delete','${t.id}')">❌</button>
                    </div>
                </li>`;
            });

            html += `</ol></div>`;
        });

    taskContainer.innerHTML = html;
}

/* MODAL */
window.openModal = (type, id, text = "") => {

    currentTaskId = id;
    currentAction = type;

    let modal = document.getElementById("modal");
    let input = document.getElementById("modalInput");
    let title = document.getElementById("modalTitle");

    modal.classList.add("active");

    if (type === "edit") {
        title.innerText = "Edit Task";
        input.style.display = "block";
        input.value = text;
    }

    if (type === "delete") {
        title.innerText = "Are you sure you want to delete?";
        input.style.display = "none";
    }
};

window.closeModal = () => {
    document.getElementById("modal").classList.remove("active");
};

window.confirmAction = () => {

    if (currentAction === "edit") {

        let newText = document.getElementById("modalInput").value;

        if (newText) {
            updateDoc(doc(db, "tasks", currentTaskId), {
                text: newText
            });
        }
    }

    if (currentAction === "delete") {
        deleteDoc(doc(db, "tasks", currentTaskId));
    }

    closeModal();
};

/* ACTIONS */
window.toggle = (id, c) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !c
    });
};

/* SEARCH */
searchInput.addEventListener("input", render);

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
