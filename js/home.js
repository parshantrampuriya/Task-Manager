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

/* ================= COUNTDOWN ================= */

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
        if (!box) return;

        box.innerHTML = `⏳ Day ends in: ${h}h ${m}m ${s}s`;

        box.classList.remove("countdown-safe","countdown-warning","countdown-danger");

        if (h > 6) box.classList.add("countdown-safe");
        else if (h > 2) box.classList.add("countdown-warning");
        else box.classList.add("countdown-danger");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/* ================= TASK STATUS ================= */

function getTaskStatus(task) {

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
    startCountdown();
});

/* LOCAL DATE */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

/* ================= QUICK ADD ================= */

window.quickAddTask = async () => {

    let text = document.getElementById("quickTaskInput").value;
    let date = document.getElementById("quickDateInput").value;
    let time = document.getElementById("quickTimeInput").value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text,
        date: date || getToday(),
        time: time || "00:00", // 🔥 default midnight
        completed: false,
        user: auth.currentUser.uid
    });

    quickTaskInput.value = "";
    quickDateInput.value = "";
    quickTimeInput.value = "";
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
    });
}

function renderHome(tasks) {

    let today = getToday();

    let todayTasks = tasks.filter(t => t.date === today);
    todayTasks.sort((a, b) => a.completed - b.completed);

    if (todayTasks.length === 0) {
        homeContent.innerHTML = `<p style="text-align:center;color:#aaa;">No tasks today</p>`;
        return;
    }

    let html = `<ol class="task-list">`;

    todayTasks.forEach((t) => {

        let status = getTaskStatus(t);

        let alert = "";

        if (status === "overdue") {
            alert = `<small style="color:red;">❗ Overdue</small>`;
        }
        else if (status === "danger") {
            alert = `<small style="color:#ff4d4d;">🔥 Due soon</small>`;
        }
        else if (status === "warning") {
            alert = `<small style="color:#ffc107;">⏳ Upcoming</small>`;
        }

        html += `
        <li class="task-item ${t.completed ? 'done' : ''} ${status || ''}">
            
            <span>${t.text}</span>

            ${t.time && t.time !== "00:00" ? `<small>🕒 ${t.time}</small>` : ""}

            ${alert}

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

        renderGoalsHome(goals);
    });
}

function renderGoalsHome(goals) {

    let container = document.getElementById("goalsHomeContainer");

    let html = "";

    goals.forEach(g => {

        let percent = Math.round((g.done / g.total) * 100 || 0);

        html += `
        <div class="goal-home-card">
            <b>${g.name}</b> → ${percent}%
            <div class="goal-home-bar">
                <div class="goal-home-fill" style="width:${percent}%"></div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

/* ================= ACTIONS ================= */

window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), { completed: !completed });
};

window.del = (id) => {
    if (confirm("Are you sure to delete?")) {
        deleteDoc(doc(db, "tasks", id));
    }
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
