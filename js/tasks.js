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

/* 🔔 NOTIFICATION MEMORY */
let notifiedTasks = {};

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

    /* 🔔 REQUEST PERMISSION */
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    let snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks();

    /* 🔁 CHECK EVERY MINUTE */
    setInterval(() => {
        render();
    }, 60000);
});

/* LOCAL DATE */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

/* ================= TASK STATUS ================= */

function getTaskStatus(task) {

    if (task.completed) return null;
    if (!task.time || task.time === "00:00") return null;

    let now = new Date();

    let [h, m] = task.time.split(":");

    let taskTime = new Date();
    taskTime.setHours(h, m, 0, 0);

    let diff = taskTime - now;

    if (diff <= 0) return "overdue";

    let hours = diff / (1000 * 60 * 60);

    if (hours <= 2) return "danger";
    if (hours <= 6) return "warning";

    return "safe";
}

/* ================= 🔔 NOTIFICATION ================= */

function checkAndNotify(task) {

    if (task.completed) return;
    if (!task.time || task.time === "00:00") return;

    let now = new Date();

    let [h, m] = task.time.split(":");

    let taskTime = new Date();
    taskTime.setHours(h, m, 0, 0);

    let diff = taskTime - now;

    if (diff <= 0) return;

    let minutesLeft = Math.floor(diff / (1000 * 60));

    let id = task.id;

    if (!notifiedTasks[id]) {
        notifiedTasks[id] = {};
    }

    if (minutesLeft <= 60 && minutesLeft > 59 && !notifiedTasks[id][60]) {
        new Notification(`⏰ 1 hour left: ${task.text}`);
        notifiedTasks[id][60] = true;
    }

    if (minutesLeft <= 30 && minutesLeft > 29 && !notifiedTasks[id][30]) {
        new Notification(`⚠ 30 min left: ${task.text}`);
        notifiedTasks[id][30] = true;
    }

    if (minutesLeft <= 10 && minutesLeft > 9 && !notifiedTasks[id][10]) {
        new Notification(`🔥 10 min left: ${task.text}`);
        notifiedTasks[id][10] = true;
    }
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
    let time = document.getElementById("timeInput").value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text,
        date: date || getToday(),
        time: time || "00:00",
        completed: false,
        user: currentUser.uid
    });

    taskInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
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

    let today = getToday();

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

                checkAndNotify(t); // 🔥 NOTIFICATION

                let status = getTaskStatus(t);

                let alert = "";

                if (!t.completed) {
                    if (status === "overdue") {
                        alert = `<small style="color:red;">❗ Overdue</small>`;
                    }
                    else if (status === "danger") {
                        alert = `<small style="color:#ff4d4d;">🔥 Due soon</small>`;
                    }
                    else if (status === "warning") {
                        alert = `<small style="color:#ffc107;">⏳ Upcoming</small>`;
                    }
                }

                html += `
                <li class="task-item ${t.completed ? 'done' : ''} ${status || ''}">
                    <span>${t.text}</span>

                    ${t.time && t.time !== "00:00" ? `<small>🕒 ${t.time}</small>` : ""}

                    ${alert}

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
