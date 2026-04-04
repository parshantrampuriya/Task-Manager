import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GET UID ================= */

const params = new URLSearchParams(location.search);
const uid = params.get("uid");

/* ================= USER ================= */

async function loadUser() {

    let snap = await getDocs(
        query(collection(db,"users"),
        where("__name__","==",uid))
    );

    let name = snap.docs[0]?.data()?.name || "User";

    document.getElementById("username").innerText = "👤 " + name;
}

/* ================= TASKS (HOME STYLE) ================= */

function loadTasks() {

    onSnapshot(
        query(collection(db,"tasks"),
        where("user","==",uid)),
    snap => {

        let html = "";

        let tasks = [];

        snap.forEach(doc=>{
            tasks.push(doc.data());
        });

        // 🔥 SAME SORT AS HOME
        tasks.sort((a,b)=>{

            if(!a.date) return 1;
            if(!b.date) return -1;

            return new Date(a.date) - new Date(b.date);
        });

        tasks.forEach(t=>{

            html += `
            <div class="task-item ${t.completed ? "completed":""}">

                <span>
                    ${t.text}
                    ${t.time ? `⏰ ${t.time}`:""}
                </span>

            </div>`;
        });

        homeContent.innerHTML = html || "No tasks";
    });
}

/* ================= GOALS (HOME STYLE) ================= */

function loadGoals() {

    onSnapshot(
        query(collection(db,"goals"),
        where("user","==",uid)),
    snap => {

        let html = "";

        snap.forEach(doc=>{

            let g = doc.data();

            let percent = Math.min((g.done/g.total)*100,100);

            html += `
            <div class="goal-home-card">

                <h4>${g.name}</h4>

                <div class="goal-home-bar">
                    <div class="goal-home-fill"
                    style="width:${percent}%"></div>
                </div>

                <small>${g.done} / ${g.total}</small>

            </div>`;
        });

        goalsHomeContainer.innerHTML = html || "No goals";
    });
}

/* ================= INIT ================= */

loadUser();
loadTasks();
loadGoals();
