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

/* 🔔 MEMORY */
let notifiedTasks = {};

/* 🔊 SOUND */
let notifySound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

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

    /* 🔔 PERMISSION */
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    /* 🔊 UNLOCK SOUND (IMPORTANT) */
    document.body.addEventListener("click", () => {
        notifySound.play().catch(()=>{});
        notifySound.pause();
    }, { once: true });

    let snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
        document.getElementById("username").innerText =
            "👤 Welcome " + snap.data().name;
    }

    loadTasks();

    setInterval(() => render(), 60000);
});

/* DATE */
function getToday() {
    return new Date().toLocaleDateString("en-CA");
}

/* STATUS */
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

/* 🔔 NOTIFICATION */
function notifyUser(message) {

    if (Notification.permission === "granted") {

        let n = new Notification(message, {
            icon: "https://cdn-icons-png.flaticon.com/512/1827/1827349.png",
            vibrate: [200, 100, 200]
        });

        /* 🔥 CLICK ACTION */
        n.onclick = () => {
            window.focus();
            window.location.href = "tasks.html";
        };

        /* 🔊 SOUND */
        notifySound.play().catch(()=>{});
    }
}

/* 🔔 CHECK */
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
        notifyUser(`⏰ 1 hour left: ${task.text}`);
        notifiedTasks[id][60] = true;
    }

    if (minutesLeft <= 30 && minutesLeft > 29 && !notifiedTasks[id][30]) {
        notifyUser(`⚠ 30 min left: ${task.text}`);
        notifiedTasks[id][30] = true;
    }

    if (minutesLeft <= 10 && minutesLeft > 9 && !notifiedTasks[id][10]) {
        notifyUser(`🔥 10 min left: ${task.text}`);
        notifiedTasks[id][10] = true;
    }
}

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

    let text = taskInput.value;
    let date = dateInput.value;
    let time = timeInput.value;

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

/* SWITCH */
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
    let search = searchInput.value.toLowerCase();

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

    Object.keys(grouped).forEach(date => {

        html += `<div class="date-group"><h3>${date}</h3><ol>`;

        grouped[date].forEach(t => {

            checkAndNotify(t); // 🔥 HERE

            html += `
            <li class="${t.completed ? 'done':''}">
                ${t.text}
                ${t.time && t.time !== "00:00" ? `🕒 ${t.time}` : ""}
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
            </li>`;
        });

        html += `</ol></div>`;
    });

    taskContainer.innerHTML = html;
}

/* ACTIONS */
window.toggle = (id, c) => {
    updateDoc(doc(db, "tasks", id), { completed: !c });
};

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});
