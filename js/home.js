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

/* NAVIGATION */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goGoals = () => window.location.href = "goals.html";
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR */
window.toggleSidebar = function () {
    document.getElementById("sidebar").classList.toggle("active");
};

/* CLICK OUTSIDE */
document.addEventListener("click", function(e) {
    let sidebar = document.getElementById("sidebar");
    let menuBtn = document.querySelector(".menu-btn");

    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});

/* 🔥 COUNTDOWN SYSTEM */
function startCountdown() {

    function updateCountdown() {

        let now = new Date();

        let tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);

        let diff = tomorrow - now;

        let h = Math.floor(diff / (1000 * 60 * 60));
        let m = Math.floor((diff / (1000 * 60)) % 60);
        let s = Math.floor((diff / 1000) % 60);

        let box = document.getElementById("countdownBox");

        if (box) {
            box.innerHTML = `⏳ Day ends in: ${h}h ${m}m ${s}s`;
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    let snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks(user.uid);
    loadGoalsHome(user.uid);

    /* 🔥 START COUNTDOWN */
    startCountdown();
});

/* 🔥 LOCAL DATE FUNCTION */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

/* ================= QUICK ADD ================= */

window.quickAddTask = async () => {

    let text = document.getElementById("quickTaskInput").value;
    let date = document.getElementById("quickDateInput").value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text,
        date: date || getToday(),
        completed: false,
        user: auth.currentUser.uid
    });

    quickTaskInput.value = "";
    quickDateInput.value = "";
};

/* ================= TASKS ================= */

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
        setTimeout(enableDragDrop, 0);
    });
}

function renderHome(tasks) {

    let today = getToday();

    let todayTasks = tasks.filter(t => t.date === today);
    todayTasks.sort((a, b) => a.completed - b.completed);

    /* 🔥 EMPTY STATE */
    if (todayTasks.length === 0) {
        homeContent.innerHTML = `
            <p style="text-align:center; margin-top:20px; color:#aaa;">
                😌 No tasks for today<br><br>
                Stay consistent 🔥
            </p>
        `;
        return;
    }

    let completed = todayTasks.filter(t => t.completed).length;
    let total = todayTasks.length;

    let percent = Math.round((completed / total) * 100);

    let html = `
        <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <p>${completed} / ${total} completed</p>
        <ol class="task-list">
    `;

    todayTasks.forEach((t) => {
        html += `
        <li class="task-item ${t.completed ? 'done' : ''}" draggable="true">
            <span>${t.text}</span>
            <div class="task-actions">
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                <button onclick="del('${t.id}')">❌</button>
            </div>
        </li>`;
    });

    html += `</ol>`;
    homeContent.innerHTML = html;
}

/* ================= GOALS ================= */

function loadGoalsHome(uid) {

    onSnapshot(collection(db, "goals"), snap => {

        let goals = [];

        snap.forEach(d => {
            let g = d.data();
            if (g.user === uid) {
                goals.push({ id: d.id, ...g });
            }
        });

        goals.sort((a, b) => (a.order || 0) - (b.order || 0));

        renderGoalsHome(goals);
        setTimeout(() => enableGoalDrag(goals), 0);
    });
}

function renderGoalsHome(goals) {

    let container = document.getElementById("goalsHomeContainer");

    let html = "";

    goals.forEach(g => {

        let percent = Math.round((g.done / g.total) * 100 || 0);

        html += `
        <div class="goal-home-card" draggable="true" data-id="${g.id}">
            <b>${g.name}</b> → ${percent}%
            <div class="goal-home-bar">
                <div class="goal-home-fill" style="width:${percent}%"></div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

/* ================= TASK ACTIONS ================= */

window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), { completed: !completed });
};

window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

window.editTask = (id, text) => {
    let t = prompt("Edit task", text);
    if (t) updateDoc(doc(db, "tasks", id), { text: t });
};

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
