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

    let sidebar = document.getElementById("sidebar");

    if (sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
    } else {
        sidebar.classList.add("active");
    }
};

/* CLICK OUTSIDE CLOSE */
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

    let docRef = doc(db, "users", user.uid);
    let snap = await getDoc(docRef);

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks(user.uid);
    loadGoalsHome(user.uid);
});

/* ================= QUICK ADD TASK ================= */

window.quickAddTask = async () => {

    let text = document.getElementById("quickTaskInput").value;
    let date = document.getElementById("quickDateInput").value;

    if (!text) return;

    let today = new Date().toISOString().split("T")[0];

    await addDoc(collection(db, "tasks"), {
        text: text,
        date: date || today,
        completed: false,
        user: auth.currentUser.uid
    });

    document.getElementById("quickTaskInput").value = "";
    document.getElementById("quickDateInput").value = "";
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

    let today = new Date().toISOString().split("T")[0];

    let todayTasks = tasks.filter(t => t.date === today);

    todayTasks.sort((a, b) => a.completed - b.completed);

    let completed = todayTasks.filter(t => t.completed).length;
    let total = todayTasks.length;

    let percent = total ? Math.round((completed / total) * 100) : 0;

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

    document.getElementById("homeContent").innerHTML = html;
}

/* ================= GOALS ================= */

function loadGoalsHome(uid) {

    onSnapshot(collection(db, "goals"), snap => {

        let goals = [];

        snap.forEach(d => {
            let g = d.data();
            if (g.user === uid) {
                goals.push(g);
            }
        });

        renderGoalsHome(goals);
    });
}

function renderGoalsHome(goals) {

    let container = document.getElementById("goalsHomeContainer");
    if (!container) return;

    if (goals.length === 0) {
        container.innerHTML = "<p>No goals added yet</p>";
        return;
    }

    let html = "";

    goals.forEach(g => {

        let percent = g.total ? Math.round((g.done / g.total) * 100) : 0;

        let extra = "";

        if (g.deadline) {

            let today = new Date();
            let end = new Date(g.deadline);

            let diff = end - today;
            let days = Math.ceil(diff / (1000 * 60 * 60 * 24));

            if (days > 0) {
                let remaining = g.total - g.done;
                let daily = Math.ceil(remaining / days);

                extra = `
                    <small>⏳ ${days} days left</small><br>
                    <small>📈 ${daily} per day needed</small>
                `;
            } else {
                extra = `<small style="color:red;">⚠ Deadline passed</small>`;
            }
        }

        html += `
        <div class="goal-home-card">

            <b>${g.name}</b> → ${percent}%

            <div class="goal-home-bar">
                <div class="goal-home-fill" style="width:${percent}%"></div>
            </div>

            ${extra}

        </div>`;
    });

    container.innerHTML = html;
}

/* ================= DRAG ================= */

function enableDragDrop() {

    let items = document.querySelectorAll(".task-item");

    let dragItem = null;

    items.forEach(item => {

        item.addEventListener("dragstart", () => {
            dragItem = item;
            item.classList.add("dragging");
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });

        item.addEventListener("dragover", (e) => e.preventDefault());

        item.addEventListener("drop", (e) => {
            e.preventDefault();

            if (dragItem !== item) {
                let list = item.parentNode;

                if ([...list.children].indexOf(dragItem) <
                    [...list.children].indexOf(item)) {
                    list.insertBefore(dragItem, item.nextSibling);
                } else {
                    list.insertBefore(dragItem, item);
                }
            }
        });
    });
}

/* ================= ACTIONS ================= */

window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !completed
    });
};

window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

window.editTask = (id, text) => {
    let t = prompt("Edit task", text);
    if (t) updateDoc(doc(db, "tasks", id), { text: t });
};

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
