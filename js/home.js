// home.js

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
setDoc,
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */
let currentUser=null;

let layout={
tasks:true,
goals:true,
quest:true,
mistakes:true,
insight:true,
countdown:true
};

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

await loadUser();
await loadLayout();
await renderDashboard();
startCountdown();

});

/* ================= USER ================= */
async function loadUser(){

const snap=await getDoc(
doc(db,"users",currentUser.uid)
);

if(snap.exists()){

document.getElementById("username")
.innerText=
"👤 Welcome " +
(snap.data().name || "User");

}

}

/* ================= LAYOUT ================= */
async function loadLayout(){

const snap=await getDoc(
doc(db,"dashboardSettings",currentUser.uid)
);

if(snap.exists()){

layout={
...layout,
...snap.data()
};

}

/* checkbox sync */
document
.querySelectorAll("#customPanel input")
.forEach(chk=>{

chk.checked=layout[chk.dataset.id];

});

}

window.toggleCustomize=()=>{

document
.getElementById("customPanel")
.classList.toggle("show");

};

window.saveLayout=async()=>{

document
.querySelectorAll("#customPanel input")
.forEach(chk=>{

layout[chk.dataset.id]=chk.checked;

});

await setDoc(
doc(db,"dashboardSettings",currentUser.uid),
layout
);

renderDashboard();
toggleCustomize();

};

/* ================= DASHBOARD ================= */
async function renderDashboard(){

const box=
document.getElementById("dashboardGrid");

let html="";

if(layout.countdown){

html+=`
<div class="card">
<h3>⏳ Countdown</h3>
<div id="countdownLive"
class="big-number">--</div>
<div class="muted">
Time remaining today
</div>
</div>
`;

}

if(layout.tasks){

html+=await taskCard();

}

if(layout.goals){

html+=await goalsCard();

}

if(layout.quest){

html+=await questCard();

}

if(layout.mistakes){

html+=await mistakesCard();

}

if(layout.insight){

html+=await insightCard();

}

box.innerHTML=html;

}

/* ================= TASK CARD ================= */
async function taskCard(){

const snap=await getDocs(
collection(db,"tasks")
);

const today=
new Date().toLocaleDateString("en-CA");

let arr=[];

snap.forEach(d=>{

let x=d.data();

if(
x.user===currentUser.uid &&
x.date===today
){
arr.push(x);
}

});

let rows="";

arr.slice(0,5).forEach(t=>{

rows+=`
<div class="task-row ${t.completed?'done':''}">
<span>${t.text}</span>
<span class="task-time">
${t.time || ""}
</span>
</div>
`;

});

if(!rows) rows=`<div class="empty">No tasks today</div>`;

return `
<div class="card full">
<h3>📅 Today Tasks</h3>
${rows}
</div>
`;

}

/* ================= GOALS ================= */
async function goalsCard(){

const snap=await getDocs(
collection(db,"goals")
);

let rows="";

snap.forEach(d=>{

let g=d.data();

if(g.user===currentUser.uid){

let p=Math.round(
(g.done/g.total)*100 || 0
);

rows+=`
<div class="goal-box">

<div class="goal-top">
<span>${g.name}</span>
<span>${p}%</span>
</div>

<div class="goal-bar">
<div class="goal-fill"
style="width:${p}%"></div>
</div>

</div>
`;

}

});

if(!rows) rows=`<div class="empty">No goals</div>`;

return `
<div class="card">
<h3>🎯 Goals</h3>
${rows}
</div>
`;

}

/* ================= QUEST ================= */
async function questCard(){

const snap=await getDocs(
collection(db,"quest")
);

let pending=0;

snap.forEach(d=>{

let q=d.data();

if(
q.uid===currentUser.uid &&
q.status==="Pending"
){
pending++;
}

});

return `
<div class="card">
<h3>❓ Quest Pending</h3>
<div class="big-number">${pending}</div>
<div class="muted">
Open doubts / topics
</div>
</div>
`;

}

/* ================= MISTAKES ================= */
async function mistakesCard(){

const snap=await getDocs(
collection(db,"mistakes")
);

let count=0;

snap.forEach(d=>{

let m=d.data();

if(m.uid===currentUser.uid){
count++;
}

});

return `
<div class="card">
<h3>❌ Mistakes</h3>
<div class="big-number">${count}</div>
<div class="muted">
Recorded mistakes
</div>
</div>
`;

}

/* ================= INSIGHT ================= */
async function insightCard(){

const snap=await getDocs(
collection(db,"insights")
);

let latest="No insights yet.";

snap.forEach(d=>{

let x=d.data();

if(x.uid===currentUser.uid){
latest=x.text;
}

});

return `
<div class="card full">
<h3>🧠 Latest Insight</h3>
<div class="quote-box">
${latest}
</div>
</div>
`;

}

/* ================= COUNTDOWN ================= */
function startCountdown(){

setInterval(()=>{

const el=
document.getElementById("countdownLive");

if(!el) return;

let now=new Date();

let end=new Date();
end.setHours(23,59,59,999);

let diff=end-now;

let h=Math.floor(diff/3600000);
let m=Math.floor((diff%3600000)/60000);
let s=Math.floor((diff%60000)/1000);

el.innerText=
`${h}h ${m}m ${s}s`;

},1000);

}

/* ================= LOGOUT ================= */
const btn=
document.getElementById("logoutBtn");

if(btn){

btn.onclick=async()=>{

await signOut(auth);
location.href="index.html";

};

}
