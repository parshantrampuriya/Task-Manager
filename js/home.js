/* ================= HOME JS FINAL UPGRADED ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
collection,
getDocs,
addDoc,
updateDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const dashboard = document.getElementById("dashboard");
const username = document.getElementById("username");
const todayCenter = document.getElementById("todayCenter");
const logoutBtn = document.getElementById("logoutBtn");

const customPopup = document.getElementById("customPopup");

const chkFocus = document.getElementById("chkFocus");
const chkTasks = document.getElementById("chkTasks");
const chkGoals = document.getElementById("chkGoals");
const chkGrowth = document.getElementById("chkGrowth");
const chkCountdown = document.getElementById("chkCountdown");
const chkQuote = document.getElementById("chkQuote");

/* ================= DATA ================= */

let currentUser = null;
let tasks = [];
let goals = [];
let quotes = [];

/* ================= STORAGE ================= */

let prefs = JSON.parse(
localStorage.getItem("dashboardPrefs")
) || {
focus:true,
tasks:true,
goals:true,
growth:true,
countdown:true,
quote:true
};

let widgetSize = JSON.parse(
localStorage.getItem("widgetSize")
) || {};

let widgetOrder = JSON.parse(
localStorage.getItem("widgetOrder")
) || [
"focus",
"countdown",
"quote",
"tasks",
"goals",
"growth"
];

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

let snap = await getDoc(
doc(db,"users",user.uid)
);

if(snap.exists()){
username.innerText =
"👤 Welcome " +
(snap.data().name || "User");
}

loadTasks();
loadGoals();
loadQuotes();
startClock();

});

/* ================= DATE ================= */

function todayDate(){
return new Date()
.toLocaleDateString("en-CA");
}

function niceDate(){
return new Date()
.toDateString();
}

/* ================= CLOCK ================= */

function startClock(){

setInterval(()=>{

let now = new Date();

let end = new Date();
end.setHours(23,59,59,999);

let diff = end-now;

let h=Math.floor(diff/3600000);
let m=Math.floor((diff%3600000)/60000);
let s=Math.floor((diff%60000)/1000);

todayCenter.innerHTML=`
<h3>${niceDate()}</h3>
<p>⏳ ${h}h ${m}m ${s}s remaining today</p>
`;

},1000);

}

/* ================= TASKS ================= */

function loadTasks(){

onSnapshot(collection(db,"tasks"),snap=>{

tasks=[];

snap.forEach(d=>{

let x=d.data();

if(x.user===currentUser.uid){
tasks.push({
id:d.id,
...x
});
}

});

renderDashboard();

});

}

window.toggleTask = async(id,done)=>{

await updateDoc(doc(db,"tasks",id),{
completed:!done
});

};

function todayTasks(){

return tasks
.filter(x=>x.date===todayDate())
.sort((a,b)=>{

if(a.completed!==b.completed){
return a.completed ? 1 : -1;
}

return (a.time||"")
.localeCompare(b.time||"");

});

}

/* ================= GOALS ================= */

function loadGoals(){

onSnapshot(collection(db,"goals"),snap=>{

goals=[];

snap.forEach(d=>{

let x=d.data();

if(x.user===currentUser.uid){
goals.push({
id:d.id,
...x
});
}

});

renderDashboard();

});

}

/* ================= QUOTES ================= */

async function loadQuotes(){

let snap = await getDocs(
collection(db,"quotes")
);

quotes=[];

snap.forEach(d=>{
quotes.push(
d.data().text
);
});

renderDashboard();

}

function randomQuote(){

if(!quotes.length){
return "Discipline today creates freedom tomorrow.";
}

return quotes[
Math.floor(
Math.random()*quotes.length
)
];

}

/* ================= COUNTS ================= */

async function getCount(col){

let snap = await getDocs(
collection(db,col)
);

let c=0;

snap.forEach(d=>{

let x=d.data();

if(x.uid===currentUser.uid)
c++;

});

return c;

}

/* ================= MAIN RENDER ================= */

async function renderDashboard(){

dashboard.innerHTML="";

for(let key of widgetOrder){

if(!prefs[key]) continue;

if(key==="focus"){
renderFocus();
}

if(key==="countdown"){
renderCountdown();
}

if(key==="quote"){
renderQuote();
}

if(key==="tasks"){
renderTasks();
}

if(key==="goals"){
renderGoals();
}

if(key==="growth"){
await renderGrowth();
}

}

}

/* ================= WIDGETS ================= */

function renderFocus(){

let t=todayTasks();

let done=t.filter(x=>x.completed).length;

let p=t.length
? Math.round(done*100/t.length)
:0;

addCard("focus",`
<div class="card-head">
<h3>📊 Today Focus</h3>
</div>

<div class="widget-body">

<div class="big-number">${p}%</div>

<div class="progress">
<div class="progress-fill"
style="width:${p}%"></div>
</div>

<div class="small-muted">
${done}/${t.length} completed
</div>

</div>
`,"compact");

}

function renderCountdown(){

addCard("countdown",`
<div class="card-head">
<h3>⏳ Countdown</h3>
</div>

<div class="widget-body">
<div class="small-muted">
Live timer shown above
</div>
</div>
`,"compact");

}

function renderQuote(){

addCard("quote",`
<div class="card-head">

<h3>💬 Quote</h3>

<button class="icon-btn"
onclick="renderDashboard()">
↻
</button>

</div>

<div class="widget-body">
<div class="quote-box">
${randomQuote()}
</div>
</div>
`,"compact");

}

function renderTasks(){

let html="";

todayTasks().forEach(x=>{

html+=`
<div class="task-row
${x.completed?'task-done':''}">

<div class="task-left">

<div class="task-title">
${x.text}
</div>

<div class="task-time">
${x.time || "00:00"}
</div>

</div>

<button class="tick-btn"
onclick="toggleTask('${x.id}',${x.completed})">
✔
</button>

</div>
`;

});

addCard("tasks",`
<div class="card-head">
<h3>📋 Today Tasks</h3>
</div>

<div class="widget-body">
${html || "No task today"}
</div>
`,"full-card");

}

function renderGoals(){

let html="";

goals.forEach(g=>{

let done=Number(g.done||0);
let total=Number(g.total||1);

let p=Math.round(
(done/total)*100
);

if(p>100) p=100;

html+=`
<div class="goal-row">

<div class="goal-title">
${g.name} - ${p}%
</div>

<div class="goal-bar">
<div class="goal-fill"
style="width:${p}%"></div>
</div>

</div>
`;

});

addCard("goals",`
<div class="card-head">
<h3>🎯 Goals</h3>
</div>

<div class="widget-body">
${html || "No goals"}
</div>
`,"compact");

}

async function renderGrowth(){

let mistakes=
await getCount("mistakes");

let insights=
await getCount("insights");

let quest=
await getCount("quest");

let smart=
await getCount("smartmoves");

addCard("growth",`
<div class="card-head">
<h3>🌱 Growth Summary</h3>
</div>

<div class="widget-body">

<div class="summary-row">
<span>Mistakes</span>
<b>${mistakes}</b>
</div>

<div class="summary-row">
<span>Insights</span>
<b>${insights}</b>
</div>

<div class="summary-row">
<span>Quest</span>
<b>${quest}</b>
</div>

<div class="summary-row">
<span>Smart Moves</span>
<b>${smart}</b>
</div>

</div>
`,"compact");

}

/* ================= CARD MAKER ================= */

function addCard(key,inner,defaultSize){

let size =
widgetSize[key] ||
defaultSize;

dashboard.innerHTML+=`

<div class="widget-card ${size}">

${inner}

<div class="popup-actions"
style="margin-top:10px;">

<button class="icon-btn"
onclick="resizeWidget('${key}','compact')">
S
</button>

<button class="icon-btn"
onclick="resizeWidget('${key}','')">
M
</button>

<button class="icon-btn"
onclick="resizeWidget('${key}','full-card')">
L
</button>

<button class="icon-btn"
onclick="moveUp('${key}')">
↑
</button>

<button class="icon-btn"
onclick="moveDown('${key}')">
↓
</button>

</div>

</div>
`;

}

/* ================= SIZE ================= */

window.resizeWidget=(key,size)=>{

widgetSize[key]=size;

localStorage.setItem(
"widgetSize",
JSON.stringify(widgetSize)
);

renderDashboard();

};

/* ================= ORDER ================= */

window.moveUp=(key)=>{

let i=widgetOrder.indexOf(key);

if(i>0){

[widgetOrder[i],widgetOrder[i-1]]
=
[widgetOrder[i-1],widgetOrder[i]];

saveOrder();

}

};

window.moveDown=(key)=>{

let i=widgetOrder.indexOf(key);

if(i<widgetOrder.length-1){

[widgetOrder[i],widgetOrder[i+1]]
=
[widgetOrder[i+1],widgetOrder[i]];

saveOrder();

}

};

function saveOrder(){

localStorage.setItem(
"widgetOrder",
JSON.stringify(widgetOrder)
);

renderDashboard();

}

/* ================= CUSTOMIZE ================= */

window.openCustomize=()=>{

customPopup.classList.add("show");

chkFocus.checked=prefs.focus;
chkTasks.checked=prefs.tasks;
chkGoals.checked=prefs.goals;
chkGrowth.checked=prefs.growth;
chkCountdown.checked=prefs.countdown;
chkQuote.checked=prefs.quote;

};

window.closeCustomize=()=>{
customPopup.classList.remove("show");
};

window.saveCustomize=()=>{

prefs={

focus:chkFocus.checked,
tasks:chkTasks.checked,
goals:chkGoals.checked,
growth:chkGrowth.checked,
countdown:chkCountdown.checked,
quote:chkQuote.checked

};

localStorage.setItem(
"dashboardPrefs",
JSON.stringify(prefs)
);

closeCustomize();
renderDashboard();

};

/* ================= LOGOUT ================= */

logoutBtn.addEventListener(
"click",
async()=>{

await signOut(auth);
location.href="index.html";

});
