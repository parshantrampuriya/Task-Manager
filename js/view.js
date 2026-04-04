import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GET FRIEND ID ================= */

const params = new URLSearchParams(location.search);
const uid = params.get("uid");

/* ================= LOAD USER NAME ================= */

async function loadUser() {

    let snap = await getDocs(
        query(collection(db,"users"),
        where("__name__","==",uid))
    );

    let name = snap.docs[0]?.data()?.name || "User";

    document.getElementById("username").innerText = "👤 " + name;
}

/* ================= LOAD TASKS ================= */

function loadTasks() {

    onSnapshot(
        query(collection(db,"tasks"),
        where("user","==",uid)),
    snap => {

        let html = "";

        snap.forEach(doc => {

            let t = doc.data();

            html += `
            <div class="card ${t.completed ? "completed":""}">
                ${t.text}
            </div>`;
        });

        taskList.innerHTML = html || "No tasks";
    });
}

/* ================= LOAD GOALS ================= */

function loadGoals() {

    onSnapshot(
        query(collection(db,"goals"),
        where("user","==",uid)),
    snap => {

        let html = "";

        snap.forEach(doc => {

            let g = doc.data();
            let percent = Math.min((g.done/g.total)*100,100);

            html += `
            <div class="card">
                <b>${g.name}</b><br>
                ${g.done} / ${g.total}

                <div class="bar">
                    <div class="fill" style="width:${percent}%"></div>
                </div>
            </div>`;
        });

        goalList.innerHTML = html || "No goals";
    });
}

/* ================= BACK ================= */

window.goBack = () => history.back();

/* ================= INIT ================= */

loadUser();
loadTasks();
loadGoals();
