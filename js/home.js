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

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
    } else {

        currentUser = user;

        /* GET USER NAME */
        let docRef = doc(db, "users", user.uid);
        let snap = await getDoc(docRef);

        if (snap.exists()) {
            let data = snap.data();
            document.getElementById("username").innerText =
                "👤 Welcome " + data.name;
        }

        loadTasks();
    }
});

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});

/* PAGE SWITCH */
window.showPage = (page) => {
    document.getElementById("homePage").style.display = "none";
    document.getElementById("taskPage").style.display = "none";

    if (page === "home") document.getElementById("homePage").style.display = "block";
    if (page === "tasks") document.getElementById("taskPage").style.display = "block";
};

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

    let html = "";

    filtered.sort((a,b)=> new Date(a.date)-new Date(b.date));

    filtered.forEach(t => {
        html += `
        <div class="task-card">
            <b>${t.text}</b><br>
            <small>${t.date || ""}</small>
            <br><br>
            <button onclick="toggle('${t.id}',${t.completed})">✔</button>
            <button onclick="del('${t.id}')">❌</button>
        </div>`;
    });

    document.getElementById("taskContainer").innerHTML = html;
}

/* TOGGLE */
window.toggle = (id, c) => {
    updateDoc(doc(db, "tasks", id), {
        completed: !c
    });
};

/* DELETE */
window.del = (id) => {
    deleteDoc(doc(db, "tasks", id));
};

/* SEARCH LIVE */
document.getElementById("searchInput").addEventListener("input", render);
