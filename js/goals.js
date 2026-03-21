import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let goals = [];

let currentIndex = null;
let currentMode = null;

/* INIT */
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    document.getElementById("addBtn").addEventListener("click", addGoal);

    loadGoals();
});

/* LOAD FROM FIREBASE */
function loadGoals() {

    onSnapshot(collection(db, "goals"), snap => {

        goals = [];

        snap.forEach(d => {
            let g = d.data();
            if (g.user === currentUser.uid) {
                goals.push({ id: d.id, ...g });
            }
        });

        render();
    });
}

/* ADD GOAL */
async function addGoal() {

    let name = document.getElementById("goalName").value;
    let total = Number(document.getElementById("goalTotal").value);
    let deadline = document.getElementById("goalDeadline").value;

    if (!name || !total) {
        alert("Enter name & total");
        return;
    }

    await addDoc(collection(db, "goals"), {
        name,
        total,
        done: 0,
        deadline: deadline || null,
        user: currentUser.uid
    });

    goalName.value = "";
    goalTotal.value = "";
    goalDeadline.value = "";
}

/* RENDER */
function render() {

    let container = document.getElementById("goalContainer");
    if (!container) return;

    let html = "";

    goals.forEach((g, i) => {

        let percent = Math.min((g.done / g.total) * 100, 100);

        html += `
        <div class="goal-card">

            <h3>${g.name}</h3>

            <p>${g.done} / ${g.total}</p>

            ${g.deadline ? `<small>⏳ Deadline: ${g.deadline}</small>` : ""}

            <div class="progress-bar">
                <div class="fill" style="width:${percent}%"></div>
            </div>

            <div class="actions">
                <button onclick="openModal('progress', ${i})">+ Progress</button>
                <button onclick="openModal('edit', ${i})">Edit</button>
                <button onclick="deleteGoal('${g.id}')">Delete</button>
            </div>

        </div>`;
    });

    container.innerHTML = html;
}

/* OPEN MODAL */
window.openModal = (mode, index) => {

    currentIndex = index;
    currentMode = mode;

    document.getElementById("modal").classList.add("active");

    let nameInput = document.getElementById("modalName");
    let totalInput = document.getElementById("modalInput");
    let dateInput = document.getElementById("modalDate");

    if (mode === "progress") {

        document.getElementById("modalTitle").innerText = "Add Progress";

        nameInput.style.display = "none";
        dateInput.style.display = "none";

        totalInput.placeholder = "Enter progress";
        totalInput.value = "";
    }

    if (mode === "edit") {

        let g = goals[index];

        document.getElementById("modalTitle").innerText = "Edit Goal";

        nameInput.style.display = "block";
        dateInput.style.display = "block";

        nameInput.value = g.name;
        totalInput.value = g.total;
        dateInput.value = g.deadline || "";
    }
};

/* CLOSE */
window.closeModal = () => {
    document.getElementById("modal").classList.remove("active");
};

/* SAVE MODAL */
window.saveModal = async () => {

    let val = document.getElementById("modalInput").value;

    if (!val) return;

    let g = goals[currentIndex];

    if (currentMode === "progress") {

        await updateDoc(doc(db, "goals", g.id), {
            done: g.done + Number(val)
        });
    }

    if (currentMode === "edit") {

        let name = document.getElementById("modalName").value;
        let total = Number(document.getElementById("modalInput").value);
        let deadline = document.getElementById("modalDate").value;

        await updateDoc(doc(db, "goals", g.id), {
            name,
            total,
            deadline: deadline || null
        });
    }

    closeModal();
};

/* DELETE */
window.deleteGoal = async (id) => {
    await deleteDoc(doc(db, "goals", id));
};

/* SIDEBAR */
window.toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
};

/* NAVIGATION */
window.goHome = () => window.location.href = "home.html";
window.goTasks = () => window.location.href = "tasks.html";
window.goGoals = () => window.location.href = "goals.html";
window.goProfile = () => window.location.href = "profile.html";

/* LOGOUT */
window.logout = () => {
    window.location.href = "index.html";
};
