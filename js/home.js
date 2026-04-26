// ================= HOME JS =================

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
getDocs,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */
const $ = (id)=>document.getElementById(id);

let currentUser=null;

let widgetState={
tasks:true,
goals:true,
mistakes:true,
insights:true,
quest:true,
countdown:true
};

let quickMode="task";

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

await loadUser();
await loadWidgetState();

setTodayBar();
renderDashboard();
startClock();

});

/* ================= USER ================= */
async function loadUser(){

const snap=await getDoc(
doc(db,"users",currentUser.uid)
);

if(snap.exists()){

$("username").innerText=
"👤 Welcome " +
(snap.data().name || "User");

}

}

/* ================= DATE ================= */
function setTodayBar(){

let d=new Date();

$("todayDate").innerText=
d.toDateString();

}

/* ================= WIDGET SETTINGS ================= */
async function loadWidgetState(){

const ref=doc(
db,
"dashboardSettings",
currentUser.uid
);

const snap=await getDoc(ref);

if(snap.exists()){

widgetState={
...widgetState,
...snap.data()
};

}

document
.querySelectorAll("[data-widget]")
.forEach(chk=>{

chk.checked=
widgetState[
chk.dataset.widget
];

});

}

window.openCustomize=()=>{
$("customPopup").classList.add("show");
};

window.closeCustomize=()=>{
$("customPopup").classList.remove("show");
};

window.saveWidgets=async()=>{

document
.querySelectorAll("[data-widget]")
.forEach(chk=>{

widgetState[
chk.dataset.widget
]=chk.checked;

});

await setDoc(
doc(db,"dashboardSettings",currentUser.uid),
widgetState
);

closeCustomize();
toast("Saved ✅");
renderDashboard();

};

/* ================= DASHBOARD ================= */
window.refreshDashboard=()=>{
renderDashboard();
toast("Refreshed 🔄");
};

async function renderDashboard(){

let html="";

if(widgetState.tasks)
html+=await tasksWidget();

if(widgetState.goals)
html+=await goalsWidget();

if(widgetState.mistakes)
html+=await mistakesWidget();

if(widgetState.insights)
html+=await insightsWidget();

if(widgetState.quest)
html+=await questWidget();

if(widgetState.countdown)
html+=countdownWidget();

$("dashboardGrid").innerHTML=html;

}

/* ================= TASKS ================= */
async function tasksWidget(){

const snap=await getDocs(
collection(db,"tasks")
);

const today=new Date()
.toLocaleDateString("en-CA");

let rows="";

snap.forEach(d=>{

let x=d.data();

if(
x.user===currentUser.uid &&
x.date===today
){

rows+=`
<div class="item-row">
<div class="item-left">
<div class="item-title">${x.text}</div>
<div class="item-sub">${x.time || ""}</div>
</div>
</div>
`;

}

});

if(!rows)
rows=`<div class="small-muted">No tasks today</div>`;

return `
<div class="widget-card full-card">

<div class="card-head">
<h3>📋 Today Tasks</h3>

<div class="card-tools">
<button class="icon-btn"
onclick="openQuick('task')">＋</button>
</div>
</div>

${rows}

</div>
`;

}

/* ================= GOALS ================= */
async function goalsWidget(){

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
<div class="item-row">
<div class="item-left">
<div class="item-title">${g.name}</div>

<div class="progress">
<div class="progress-fill"
style="width:${p}%"></div>
</div>

</div>

<div>${p}%</div>
</div>
`;

}

});

if(!rows)
rows=`<div class="small-muted">No goals</div>`;

return `
<div class="widget-card">
<div class="card-head">
<h3>🎯 Goals</h3>
</div>
${rows}
</div>
`;

}

/* ================= MISTAKES ================= */
async function mistakesWidget(){

const snap=await getDocs(
collection(db,"mistakes")
);

let count=0;

snap.forEach(d=>{
if(d.data().uid===currentUser.uid)
count++;
});

return `
<div class="widget-card">

<div class="card-head">

<h3>❌ Mistakes</h3>

<div class="card-tools">
<button class="icon-btn"
onclick="openQuick('mistake')">＋</button>
</div>

</div>

<div class="big-number">${count}</div>
<div class="small-muted">
Total mistakes recorded
</div>

</div>
`;

}

/* ================= INSIGHTS ================= */
async function insightsWidget(){

const snap=await getDocs(
collection(db,"insights")
);

let latest="No insight added";

snap.forEach(d=>{

let x=d.data();

if(x.uid===currentUser.uid)
latest=x.text;

});

return `
<div class="widget-card full-card">

<div class="card-head">

<h3>🧠 Insights</h3>

<div class="card-tools">
<button class="icon-btn"
onclick="openQuick('insight')">＋</button>
</div>

</div>

<div class="item-row">
<div class="item-title">
${latest}
</div>
</div>

</div>
`;

}

/* ================= QUEST ================= */
async function questWidget(){

const snap=await getDocs(
collection(db,"quest")
);

let pending=0;

snap.forEach(d=>{

let x=d.data();

if(
x.uid===currentUser.uid &&
x.status==="Pending"
) pending++;

});

return `
<div class="widget-card">

<div class="card-head">

<h3>❓ Quest</h3>

<div class="card-tools">
<button class="icon-btn"
onclick="openQuick('quest')">＋</button>
</div>

</div>

<div class="big-number">${pending}</div>

<div class="small-muted">
Pending questions
</div>

</div>
`;

}

/* ================= COUNTDOWN ================= */
function countdownWidget(){

return `
<div class="widget-card">

<div class="card-head">
<h3>⏳ Countdown</h3>
</div>

<div id="liveClock"
class="big-number">--</div>

<div class="small-muted">
Today ends in
</div>

</div>
`;

}

/* ================= CLOCK ================= */
function startClock(){

setInterval(()=>{

let el=$("liveClock");
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

/* ================= QUICK POPUP ================= */
window.openQuick=(type)=>{

quickMode=type;

$("popupTitle").innerText=
"Add " +
type.charAt(0).toUpperCase() +
type.slice(1);

$("popupType").value=type;

$("popupDate").value=
new Date().toISOString()
.split("T")[0];

$("quickPopup")
.classList.add("show");

};

window.closeQuickPopup=()=>{
$("quickPopup")
.classList.remove("show");
};

window.saveQuickItem=async()=>{

let text=$("popupText").value.trim();

if(!text) return toast("Enter text");

let date=$("popupDate").value;
let time=$("popupTime").value;

if(quickMode==="task"){

await addDoc(collection(db,"tasks"),{
text,
date,
time:time || "00:00",
completed:false,
user:currentUser.uid
});

}

if(quickMode==="mistake"){

await addDoc(collection(db,"mistakes"),{
text,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

if(quickMode==="insight"){

await addDoc(collection(db,"insights"),{
text,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

if(quickMode==="quest"){

await addDoc(collection(db,"quest"),{
text,
date,
uid:currentUser.uid,
status:"Pending",
createdAt:Date.now()
});

}

$("popupText").value="";
closeQuickPopup();
toast("Saved ✅");
renderDashboard();

};

/* ================= TOAST ================= */
function toast(msg){

$("toast").innerText=msg;
$("toast").classList.add("show");

setTimeout(()=>{
$("toast").classList.remove("show");
},1800);

}

/* ================= LOGOUT ================= */
const logoutBtn=$("logoutBtn");

if(logoutBtn){

logoutBtn.onclick=async()=>{

await signOut(auth);
location.href="index.html";

};

}
