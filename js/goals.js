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

/* LOAD */
function loadGoals() {

    onSnapshot(collection(db, "goals"), snap => {

        goals = [];

        snap.forEach(d => {
            let g = d.data();
            if (g.user === currentUser.uid) {
                goals.push({ id: d.id, ...g });
            }
        });

        /* 🔥 SORT BY ORDER */
        goals.sort((a, b) => (a.order || 0) - (b.order || 0));

        render();

        setTimeout(enableDrag, 0);
    });
}

/* ADD GOAL */
async function addGoal() {

    let name = goalName.value;
    let total = Number(goalTotal.value);
    let deadline = goalDeadline.value;

    if (!name || !total) return alert("Enter name & total");

    await addDoc(collection(db, "goals"), {
        name,
        total,
        done: 0,
        deadline: deadline || null,
        user: currentUser.uid,
        order: Date.now() // 🔥 initial order
    });

    goalName.value = "";
    goalTotal.value = "";
    goalDeadline.value = "";
}

/* RENDER */
function render() {

    let container = document.getElementById("goalContainer");

    let html = "";

    goals.forEach((g, i) => {

        let percent = Math.min((g.done / g.total) * 100, 100);

        html += `
        <div class="goal-card" draggable="true" data-id="${g.id}">

            <h3>${g.name}</h3>

            <p>${g.done} / ${g.total}</p>

            ${g.deadline ? `<small>⏳ ${g.deadline}</small>` : ""}

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

/* 🔥 DRAG SYSTEM */
function enableDrag() {

    let items = document.querySelectorAll(".goal-card");
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

        item.addEventListener("drop", async e => {

            e.preventDefault();

            if (dragItem !== item) {

                let list = item.parentNode;

                if ([...list.children].indexOf(dragItem) <
                    [...list.children].indexOf(item)) {
                    list.insertBefore(dragItem, item.nextSibling);
                } else {
                    list.insertBefore(dragItem, item);
                }

                /* 🔥 SAVE ORDER */
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

/* MODAL */
window.openModal = (mode, index) => {

    currentIndex = index;
    currentMode = mode;

    modal.classList.add("active");

    let g = goals[index];

    if (mode === "progress") {

        modalTitle.innerText = "Add Progress";
        modalName.style.display = "none";
        modalDate.style.display = "none";
        modalInput.value = "";

    } else {

        modalTitle.innerText = "Edit Goal";
        modalName.style.display = "block";
        modalDate.style.display = "block";

        modalName.value = g.name;
        modalInput.value = g.total;
        modalDate.value = g.deadline || "";
    }
};

window.closeModal = () => modal.classList.remove("active");

/* SAVE */
window.saveModal = async () => {

    let g = goals[currentIndex];

    if (currentMode === "progress") {

        let val = Number(modalInput.value);
        if (!val) return;

        await updateDoc(doc(db, "goals", g.id), {
            done: g.done + val
        });

    } else {

        await updateDoc(doc(db, "goals", g.id), {
            name: modalName.value,
            total: Number(modalInput.value),
            deadline: modalDate.value || null
        });
    }

    closeModal();
};

/* DELETE */
window.deleteGoal = async (id) => {
    await deleteDoc(doc(db, "goals", id));
};

/* SIDEBAR FIX */
window.toggleSidebar = () => {
    sidebar.classList.toggle("active");
};

/* CLICK OUTSIDE */
document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});

/* NAV */
window.goHome = () => location.href = "home.html";
window.goTasks = () => location.href = "tasks.html";
window.goGoals = () => location.href = "goals.html";
window.goProfile = () => location.href = "profile.html";

/* LOGOUT */
window.logout = () => location.href = "index.html";
