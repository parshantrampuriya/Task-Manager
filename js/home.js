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
let currentTasks = [];
let currentTaskId = null;
let currentAction = null;

/* NAV */
window.goHome = () => location.href = "home.html";
window.goTasks = () => location.href = "tasks.html";
window.goGoals = () => location.href = "goals.html";
window.goProfile = () => location.href = "profile.html";

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
};

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    let snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
        username.innerText = "👤 Welcome " + snap.data().name;
    }

    loadTasks(user.uid);
    loadGoalsHome(user.uid);

    startCountdown();
});

/* DATE */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

/* ================= COUNTDOWN WITH SECONDS ================= */

function startCountdown() {

    setInterval(() => {

        let now = new Date();
        let midnight = new Date();
        midnight.setHours(23,59,59,999);

        let diff = midnight - now;

        let hrs = Math.floor(diff / 3600000);
        let mins = Math.floor((diff % 3600000) / 60000);
        let secs = Math.floor((diff % 60000) / 1000);

        countdownBox.innerText =
            `⏳ Today ends in ${hrs}h ${mins}m ${secs}s`;

    }, 1000);
}

/* ================= QUICK ADD ================= */

window.quickAddTask = async () => {

    let text = quickTaskInput.value;
    let date = quickDateInput.value;
    let time = quickTimeInput.value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text,
        date: date || getToday(),
        time: time || "00:00",
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

        currentTasks = tasks;

        renderHome(tasks);
    });
}

/* STATUS */
function getStatus(t) {

    if (!t.time || t.time === "00:00") return "normal";

    let now = new Date();
    let taskTime = new Date(`${t.date}T${t.time}`);
    let diff = taskTime - now;

    if (diff < 0) return "overdue";
    if (diff < 30 * 60000) return "urgent";
    if (diff < 60 * 60000) return "soon";

    return "normal";
}

/* ================= RENDER ================= */

function renderHome(tasks) {

    let today = getToday();

    let todayTasks = tasks.filter(t => t.date === today);

    /* 🔥 ADVANCED SORT */
    todayTasks.sort((a, b) => {

        // completed always bottom
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // tasks WITH time first
        if ((a.time && a.time !== "00:00") && (!b.time || b.time === "00:00")) return -1;
        if ((!a.time || a.time === "00:00") && (b.time && b.time !== "00:00")) return 1;

        // both have time → sort by time
        return (a.time || "").localeCompare(b.time || "");
    });

    let html = `<ol class="task-list">`;

    todayTasks.forEach((t) => {

        let status = getStatus(t);

        html += `
        <li class="task-item ${t.completed ? 'done' : ''} ${status}">
            
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <span>${t.text}</span>
                ${t.time && t.time !== "00:00" ? `<small>🕒 ${t.time}</small>` : ""}
            </div>

            <div class="task-actions">
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button onclick="openModal('edit','${t.id}','${t.text}','${t.date}','${t.time || ''}')">✏️</button>
                <button onclick="openModal('delete','${t.id}')">❌</button>
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
        setTimeout(enableDrag, 0);
    });
}

function renderGoalsHome(goals) {

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

    goalsHomeContainer.innerHTML = html;
}

/* DRAG */
function enableDrag() {

    let items = document.querySelectorAll(".goal-home-card");
    let dragItem = null;

    items.forEach(item => {

        item.addEventListener("dragstart", () => {
            dragItem = item;
            item.style.opacity = "0.5";
        });

        item.addEventListener("dragend", () => {
            item.style.opacity = "1";
        });

        item.addEventListener("dragover", e => e.preventDefault());

        item.addEventListener("drop", async () => {

            let list = item.parentNode;

            if (dragItem !== item) {

                list.insertBefore(dragItem, item);

                let updated = [...list.children];

                for (let i = 0; i < updated.length; i++) {

                    let id = updated[i].dataset.id;

                    await updateDoc(doc(db, "goals", id), {
                        order: i
                    });
                }
            }
        });
    });
}

/* ================= MODAL ================= */

window.openModal = (type, id, text="", date="", time="") => {

    currentTaskId = id;
    currentAction = type;

    modal.classList.add("active");

    modalText.style.display = "block";
    modalDate.style.display = "block";
    modalTime.style.display = "block";

    if (type === "edit") {
        modalTitle.innerText = "Edit Task";
        modalText.value = text;
        modalDate.value = date;
        modalTime.value = time;
    }

    if (type === "delete") {
        modalTitle.innerText = "Delete this task?";
        modalText.style.display = "none";
        modalDate.style.display = "none";
        modalTime.style.display = "none";
    }
};

window.closeModal = () => {
    modal.classList.remove("active");
};

/* CONFIRM */
window.confirmAction = async () => {

    if (currentAction === "edit") {
        await updateDoc(doc(db, "tasks", currentTaskId), {
            text: modalText.value,
            date: modalDate.value,
            time: modalTime.value || "00:00"
        });
    }

    if (currentAction === "delete") {
        await deleteDoc(doc(db, "tasks", currentTaskId));
    }

    closeModal();
};

/* ACTION */
window.toggle = (id, completed) => {
    updateDoc(doc(db, "tasks", id), { completed: !completed });
};

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
});
