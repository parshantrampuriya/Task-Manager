/* ================= HOME.JS FINAL FULL UPDATED ================= */
/* Added: Friend permission lock system */
/* Keeps all existing features same */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
doc,
getDoc,
getDocs,
addDoc,
updateDoc,
setDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ========= DOM ========= */
const $ = id => document.getElementById(id);

/* ========= URL ========= */
const params = new URLSearchParams(location.search);
const viewUser = params.get("viewUser");

/* ========= GLOBAL ========= */
let uid = null;
let realUid = null;
let isViewMode = false;

let tasks = [];
let goals = [];

let counts = {
mistakes:0,
insights:0,
quest:0,
smartmoves:0
};

let layout = ["focus","tasks","quote","goals","growth"];
let widgetSizes = {};

let friendPermission = null;

/* ========= AUTH ========= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

realUid = user.uid;

if(viewUser){
uid = viewUser;
isViewMode = true;
}else{
uid = realUid;
}

/* Load name */
const snap = await getDoc(doc(db,"users",uid));

if(snap.exists()){

const name = snap.data().name || "User";

if(isViewMode){
$("username").innerText =
"👀 Viewing " + name;

createExitViewButton();

/* check permission first */
const allowed =
await checkFriendPermission();

if(!allowed){
showBlockedPage(name);
return;
}

}else{
$("username").innerText =
"Welcome " + name;
}

}

/* hide top buttons */
if(isViewMode){

document.querySelectorAll(".top-btn,.add-btn")
.forEach(x=>x.style.display="none");

}

/* own settings only */
if(!isViewMode){
await loadDashboardSettings();
}

setDate();
startTimer();
loadLive();

});

/* ========= FRIEND PERMISSION ========= */
async function checkFriendPermission(){

const snap = await getDocs(collection(db,"friends"));

for(const d of snap.docs){

const data = d.data();
const users = data.users || [];

if(
users.includes(realUid) &&
users.includes(uid)
){

friendPermission =
data.permissions?.[uid] || {};

return friendPermission.home === true;

}

}

return false;

}

/* ========= BLOCK PAGE ========= */
function showBlockedPage(name){

$("dashboardGrid").innerHTML = `
<div style="
grid-column:1/-1;
padding:60px 30px;
text-align:center;
background:#111827;
border-radius:18px;
box-shadow:0 0 25px rgba(0,255,255,.15);
">

<div style="font-size:60px;">🔒</div>

<h2 style="margin-top:15px;">
${name} blocked this page
</h2>

<p style="opacity:.8;margin-top:10px;">
Your friend has restricted access.
</p>

<button onclick="location.href='home.html'"
style="
margin-top:25px;
padding:14px 24px;
border:none;
border-radius:14px;
font-weight:700;
cursor:pointer;
background:linear-gradient(45deg,#00eaff,#00ff9d);
">
↩ My Dashboard
</button>

</div>
`;

}

/* ========= EXIT BUTTON ========= */
function createExitViewButton(){

if($("exitViewBtn")) return;

const btn = document.createElement("button");

btn.id="exitViewBtn";
btn.innerHTML="↩ My Dashboard";

btn.style.position="fixed";
btn.style.top="16px";
btn.style.right="20px";
btn.style.zIndex="999";
btn.style.padding="12px 18px";
btn.style.border="none";
btn.style.borderRadius="14px";
btn.style.fontWeight="700";
btn.style.cursor="pointer";
btn.style.background=
"linear-gradient(45deg,#00eaff,#00ff9d)";

btn.onclick=()=>{
location.href="home.html";
};

document.body.appendChild(btn);

}

/* ========= SETTINGS ========= */
async function loadDashboardSettings(){

const snap =
await getDoc(doc(db,"dashboardSettings",realUid));

if(snap.exists()){

const d = snap.data();

if(Array.isArray(d.layout))
layout = d.layout;

if(d.widgetSizes)
widgetSizes = d.widgetSizes;

}

}

async function saveDashboardSettings(){

if(isViewMode) return;

await setDoc(
doc(db,"dashboardSettings",realUid),
{
layout,
widgetSizes
},
{merge:true}
);

}

/* ========= DATE ========= */
function setDate(){

$("todayDate").innerText =
new Date().toDateString();

}

function startTimer(){

setInterval(()=>{

const now = new Date();
const end = new Date();

end.setHours(23,59,59,999);

const diff = end-now;

const h =
Math.floor(diff/3600000);

const m =
Math.floor((diff%3600000)/60000);

const s =
Math.floor((diff%60000)/1000);

$("countdownText").innerText =
`⏳ ${h}h ${m}m ${s}s remaining today`;

},1000);

}

/* ========= LOAD ========= */
function loadLive(){

onSnapshot(collection(db,"tasks"),snap=>{

tasks=[];

snap.forEach(d=>{

let x=d.data();

if(x.user===uid)
tasks.push({id:d.id,...x});

});

render();

});

onSnapshot(collection(db,"goals"),snap=>{

goals=[];

snap.forEach(d=>{

let x=d.data();

if(x.user===uid)
goals.push(x);

});

render();

});

loadCounts();

}

async function loadCounts(){

counts.mistakes =
await getCollectionCount("mistakes");

counts.insights =
await getCollectionCount("insights");

counts.quest =
await getCollectionCount("quest");

counts.smartmoves =
await getCollectionCount("smartmoves");

render();

}

async function getCollectionCount(name){

const snap =
await getDocs(collection(db,name));

let c=0;

snap.forEach(d=>{
if(d.data().uid===uid) c++;
});

return c;

}

/* ========= RENDER ========= */
function render(){

const grid = $("dashboardGrid");
grid.innerHTML="";

/* widget permission filtering */
layout.forEach(type=>{

if(
isViewMode &&
friendPermission
){

if(type==="tasks" && !friendPermission.tasks) return;
if(type==="goals" && !friendPermission.goals) return;
if(type==="growth" && !friendPermission.growth) return;

}

if(type==="focus") grid.appendChild(focusCard());
if(type==="tasks") grid.appendChild(taskCard());
if(type==="quote") grid.appendChild(quoteCard());
if(type==="goals") grid.appendChild(goalCard());
if(type==="growth") grid.appendChild(growthCard());

});

if(!isViewMode){
enableDragAndResize();
}

}

/* ========= BASE ========= */
function makeCard(title,id,wide=false){

const div =
document.createElement("div");

div.className =
"widget-card " +
(wide?"full-card":"");

div.dataset.id=id;

if(!isViewMode)
div.draggable=true;

div.innerHTML=`
<div class="card-head">
<h3>${title}</h3>
</div>
<div class="widget-body"></div>
`;

if(widgetSizes[id]){

div.style.width =
widgetSizes[id].width || "";

div.style.height =
widgetSizes[id].height || "";

}

return div;

}

/* ========= CARDS ========= */
function focusCard(){

const card =
makeCard("📊 Today Focus","focus");

const today = getTodayTasks();

const done =
today.filter(x=>x.completed).length;

const total = today.length;

const p =
total ? Math.round(done*100/total):0;

card.querySelector(".widget-body").innerHTML=`
<div class="big-number">${p}%</div>
<div class="progress">
<div class="progress-fill"
style="width:${p}%"></div>
</div>
<div class="small-muted">
${done}/${total} completed
</div>
`;

return card;

}

function taskCard(){

const card =
makeCard("📋 Today Tasks","tasks",true);

let arr = getTodayTasks();

let html="";

arr.forEach(x=>{

html+=`
<div class="task-row">

<div class="task-left">
<div class="task-title">${x.text}</div>
<div class="task-time">${x.time||"00:00"}</div>
</div>

${!isViewMode ? `
<button class="tick-btn"
onclick="toggleTask('${x.id}',${x.completed})">
✔
</button>`:""}

</div>
`;

});

card.querySelector(".widget-body").innerHTML =
html || "No task";

return card;

}

function quoteCard(){

const q = [
"Discipline today creates freedom tomorrow.",
"Consistency creates success.",
"Small progress daily beats excuses."
];

const text =
q[Math.floor(Math.random()*q.length)];

const card =
makeCard("💬 Quote","quote");

card.querySelector(".widget-body").innerHTML =
`<div class="quote-box">${text}</div>`;

return card;

}

function goalCard(){

const card =
makeCard("🎯 Goals","goals");

let html="";

goals.forEach(g=>{

const p =
g.total>0 ?
Math.round((g.done/g.total)*100):0;

html+=`
<div class="goal-row">
<div>${g.name} - ${p}%</div>

<div class="goal-bar">
<div class="goal-fill"
style="width:${p}%"></div>
</div>
</div>
`;

});

card.querySelector(".widget-body").innerHTML =
html || "No goals";

return card;

}

function growthCard(){

const card =
makeCard("🌱 Growth Summary","growth");

card.querySelector(".widget-body").innerHTML=`
<div class="summary-row"><span>Mistakes</span><b>${counts.mistakes}</b></div>
<div class="summary-row"><span>Insights</span><b>${counts.insights}</b></div>
<div class="summary-row"><span>Quest</span><b>${counts.quest}</b></div>
<div class="summary-row"><span>Smart Moves</span><b>${counts.smartmoves}</b></div>
`;

return card;

}

/* ========= HELPERS ========= */
function getTodayTasks(){

const today =
new Date().toLocaleDateString("en-CA");

return tasks.filter(x=>x.date===today);

}

/* ========= TASK ========= */
window.toggleTask = async(id,val)=>{

if(isViewMode) return;

await updateDoc(doc(db,"tasks",id),{
completed:!val
});

};

/* ========= DRAG ========= */
function enableDragAndResize(){

let drag=null;

document.querySelectorAll(".widget-card")
.forEach(card=>{

card.addEventListener("dragstart",()=>{
drag=card;
});

card.addEventListener("dragover",e=>{
e.preventDefault();
});

card.addEventListener("drop",async()=>{

if(drag===card) return;

$("dashboardGrid")
.insertBefore(drag,card);

await saveOrder();

});

});

}

async function saveOrder(){

layout=[];

document.querySelectorAll(".widget-card")
.forEach(x=>{
layout.push(x.dataset.id);
});

await saveDashboardSettings();

}

/* ========= LOGOUT ========= */
$("logoutBtn").onclick = async()=>{

await signOut(auth);
location.href="index.html";

};
