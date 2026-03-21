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

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
};

/* PAGE SWITCH */
window.showPage = (page) => {
    document.getElementById("homePage").style.display = "none";
    document.getElementById("taskPage").style.display = "none";

    if (page === "home") document.getElementById("homePage").style.display = "block";
    if (page === "tasks") document.getElementById("taskPage").style.display = "block";
};

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
        renderHome();
    });
}

/* ADD */
window.addTask = async () => {

    let text = document.getElementById("taskInput").value;
    let date = document.getElementById("dateInput").value;

    if (!text) return;

    await addDoc(collection(db, "tasks"), {
        text,
        date,
        completed:false,
        user: currentUser.uid
    });

    taskInput.value = "";
};

/* SWITCH TAB */
window.switchTab = (tab) => {
    currentTab = tab;
    render();
};

/* ================= TASK PAGE ================= */
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

        let dayName = new Date(date).toLocaleDateString("en-US",{weekday:"long"});

        html += `
        <div class="date-group">
            <h3>📅 ${dayName} (${date})</h3>
            <ol class="task-list">
        `;

        grouped[date].forEach((t,index) => {
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

/* ================= HOME PAGE ================= */
function renderHome() {

    let today = new Date().toISOString().split("T")[0];

    let todayTasks = tasks.filter(t => t.date === today);

    let completed = todayTasks.filter(t => t.completed).length;
    let total = todayTasks.length;

    let percent = total ? Math.round((completed/total)*100) : 0;

    let html = `
        <h2>📅 Today's Tasks</h2>

        <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <p>${completed} / ${total} completed</p>

        <ol class="task-list">
    `;

    todayTasks.forEach(t=>{
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

    html += `</ol>`;

    document.querySelector("#homePage .content").innerHTML = html;
}

/* EDIT */
window.editTask = (id,text)=>{
    let newText = prompt("Edit task",text);
    if(newText){
        updateDoc(doc(db,"tasks",id),{text:newText});
    }
};

/* TOGGLE */
window.toggle = (id,c)=>{
    updateDoc(doc(db,"tasks",id),{completed:!c});
};

/* DELETE */
window.del = (id)=> deleteDoc(doc(db,"tasks",id));

/* SEARCH */
document.getElementById("searchInput").addEventListener("input", render);
