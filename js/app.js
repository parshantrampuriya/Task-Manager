
import { auth, db } from "./firebase.js";

import {
  collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { signOut, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let allTasks = [];
let currentTab = "pending";
/* AUTH */
onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
    else {
        currentUser = user;
        loadTasks();
    }
});

/* LOGOUT */
window.logout = () => {
    signOut(auth);
    window.location.href = "index.html";
};

/* LOAD */
function loadTasks(){
    onSnapshot(collection(db,"tasks"), snap=>{
        allTasks = [];

        snap.forEach(d=>{
            let t = d.data();
            if(t.user === currentUser.uid){
                allTasks.push({id:d.id,...t});
            }
        });

        renderTasks();
    });
}

/* ADD */
window.add = async () => {
    if(!taskInput.value) return;

    await addDoc(collection(db,"tasks"),{
        text: taskInput.value,
        date: dateInput.value,
        completed:false,
        user: currentUser.uid
    });

    taskInput.value="";
};

/* EDIT */
window.editTask = (id, text) => {
    let newText = prompt("Edit task", text);
    if(newText){
        updateDoc(doc(db,"tasks",id),{text:newText});
    }
};

/* TOGGLE */
window.toggle = (id, c) => {
    updateDoc(doc(db,"tasks",id),{completed:!c});
};

/* DELETE */
window.del = (id) => deleteDoc(doc(db,"tasks",id));

/* MAIN RENDER */
window.renderTasks = () => {

    let today = new Date().toISOString().split("T")[0];
    let search = searchInput.value.toLowerCase();

    let filtered = allTasks.filter(t =>
        t.text.toLowerCase().includes(search)
    );

    let due = [];
    let pending = [];
    let completed = [];

    filtered.forEach(t=>{
        if(t.completed) completed.push(t);
        else if(t.date < today) due.push(t);
        else pending.push(t);
    });

    let tabsHTML = `
    <div class="tabs-container">
        ${createTab("🔥 Due Tasks", due)}
        ${createTab("📌 Pending Tasks", pending)}
        ${createTab("✅ Completed Tasks", completed)}
    </div>
    `;

    document.getElementById("tabs").innerHTML = tabsHTML;
};

/* CREATE TAB */
function createTab(title, tasks){

    tasks.sort((a,b)=> new Date(a.date)-new Date(b.date));

    let html = `<div class="tab"><h3>${title}</h3><div class="task-grid">`;

    tasks.forEach(t=>{
        html += `
        <div class="task-card">
            <b>${t.text}</b><br>
            <small>${t.date || ""}</small>

            <div class="task-actions">
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                <button onclick="del('${t.id}')">❌</button>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    return html;
}
