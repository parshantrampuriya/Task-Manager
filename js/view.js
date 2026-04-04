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

        let today = new Date().toISOString().split("T")[0];

        // 🔥 FILTER ONLY TODAY TASKS
        tasks = tasks.filter(t => t.date === today);

        // 🔥 SORT (PENDING FIRST → TIME ORDER)
        tasks.sort((a,b)=>{

            if(a.completed !== b.completed){
                return a.completed - b.completed;
            }

            if(!a.time) return 1;
            if(!b.time) return -1;

            return a.time.localeCompare(b.time);
        });

        // 🔥 RENDER SAME AS HOME
        tasks.forEach(t=>{

            html += `
            <div class="task-item ${t.completed ? "completed":""}">

                <span>
                    ${t.text}
                    ${t.time ? `⏰ ${t.time}`:""}
                </span>

            </div>`;
        });
tasks.forEach(t=>{

    html += `
    <div class="task-item">

        <span class="${t.completed ? "completed":""}">
            ${t.text}
            ${t.time ? ` ⏰ ${t.time}`:""}
        </span>

    </div>`;
});
        homeContent.innerHTML = html || "No tasks for today";
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

            let percent = 0;

            if (g.total && g.total > 0) {
                percent = Math.min(Math.round((g.done / g.total) * 100), 100);
            }

            html += `
            <div class="goal-home-card">

                <h4>${g.name}</h4>

                <div class="goal-home-bar">
                    <div class="goal-home-fill"
                    style="width:${percent}%"></div>
                </div>

                <small>
                    ${g.done} / ${g.total} 
                    (${percent}%)
                </small>

            </div>`;
        });

        goalsHomeContainer.innerHTML = html || "No goals";
    });
}

/* ================= INIT ================= */

loadUser();
loadTasks();
loadGoals();
