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
window.goGoals = () => window.location.href = "goals.html"; // 🔥 ADDED
window.goProfile = () => window.location.href = "profile.html";

/* SIDEBAR TOGGLE */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
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
        renderGoalsHome(); // 🔥 ADDED

        setTimeout(enableDragDrop, 0);
    });
}

/* HOME RENDER */
function renderHome(tasks) {

    let today = new Date().toISOString().split("T")[0];

    let todayTasks = tasks.filter(t => t.date === today);

    /* SORT → incomplete first */
    todayTasks.sort((a, b) => a.completed - b.completed);

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

/* ================= GOALS ON HOME ================= */

function renderGoalsHome() {

    let goals = JSON.parse(localStorage.getItem("goals")) || [];

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

        /* 🔥 DEADLINE LOGIC */
        if (g.deadline) {

            let today = new Date();
            let end = new Date(g.deadline);

            let diffTime = end - today;
            let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (days > 0) {

                let remaining = g.total - g.done;
                let daily = Math.ceil(remaining / days);

                extra = `
                    <small>⏳ ${days} days left</small><br>
                    <small>📈 ${daily} per day needed</small>
                `;
            } 
            else {
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
/* ================= DRAG & DROP ================= */

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

        item.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        item.addEventListener("drop", (e) => {
            e.preventDefault();

            if (dragItem !== item) {

                let list = item.parentNode;
                let itemsArr = [...list.children];

                let dragIndex = itemsArr.indexOf(dragItem);
                let dropIndex = itemsArr.indexOf(item);

                if (dragIndex < dropIndex) {
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
