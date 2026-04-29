/* ================= HOME.JS FINAL FULL UPDATED ================= */

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

/* ========= URL PARAMS ========= */
const params = new URLSearchParams(location.search);
const viewUser = params.get("viewUser");

/* ========= GLOBAL ========= */
let uid = null;        // whose data showing
let realUid = null;   // logged in user
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

/* ========= AUTH ========= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

realUid = user.uid;

/* Friend view mode */
if(viewUser){
uid = viewUser;
isViewMode = true;
}else{
uid = realUid;
}

/* Load user name */
const snap = await getDoc(doc(db,"users",uid));

if(snap.exists()){

const name = snap.data().name || "User";

if(isViewMode){
$("username").innerText = "👀 Viewing " + name;
createExitViewButton();
}else{
$("username").innerText = "Welcome " + name;
}

}

/* Hide edit buttons in friend mode */
if(isViewMode){

document.querySelectorAll(".top-btn,.add-btn")
.forEach(x=>x.style.display="none");

}

/* Own settings only */
if(!isViewMode){
await loadDashboardSettings();
}

setDate();
startTimer();
loadLive();

});

/* ========= EXIT FRIEND VIEW ========= */
function createExitViewButton(){

if(document.getElementById("exitViewBtn")) return;

const btn = document.createElement("button");

btn.id = "exitViewBtn";
btn.innerHTML = "↩ My Dashboard";

btn.style.position = "fixed";
btn.style.top = "16px";
btn.style.right = "20px";
btn.style.zIndex = "999";
btn.style.padding = "12px 18px";
btn.style.border = "none";
btn.style.borderRadius = "14px";
btn.style.cursor = "pointer";
btn.style.fontWeight = "700";
btn.style.color = "#000";
btn.style.background =
"linear-gradient(45deg,#00eaff,#00ff9d)";
btn.style.boxShadow =
"0 0 18px rgba(0,255,255,.4)";

btn.onclick = ()=>{
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
layout:layout,
widgetSizes:widgetSizes
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

/* ========= LOAD LIVE ========= */
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

layout.forEach(type=>{

if(type==="focus")
grid.appendChild(focusCard());

if(type==="tasks")
grid.appendChild(taskCard());

if(type==="quote")
grid.appendChild(quoteCard());

if(type==="goals")
grid.appendChild(goalCard());

if(type==="growth")
grid.appendChild(growthCard());

});

if(!isViewMode){
enableDragAndResize();
}

}

/* ========= BASE CARD ========= */
function makeCard(title,id,wide=false){

const div =
document.createElement("div");

div.className =
"widget-card " +
(wide ? "full-card":"");

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

/* ========= WIDGETS ========= */

function focusCard(){

const card =
makeCard("📊 Today Focus","focus");

const today =
getTodayTasks();

const done =
today.filter(x=>x.completed).length;

const total =
today.length;

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

let arr =
getTodayTasks();

arr.sort((a,b)=>{

if(a.completed!==b.completed)
return a.completed ? 1:-1;

return (a.time||"")
.localeCompare(b.time||"");

});

let html="";

arr.forEach(x=>{

html+=`
<div class="task-row ${x.completed?'task-done':''}">

<div class="task-left">
<div class="task-title">${x.text}</div>
<div class="task-time">${x.time || "00:00"}</div>
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
"Small progress daily beats excuses.",
"Consistency creates success.",
"Action cures fear."
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

const done =
Number(g.done||0);

const total =
Number(g.total||0);

const p =
total>0 ?
Math.round((done/total)*100):0;

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

/* ========= TASK TOGGLE ========= */
window.toggleTask = async(id,val)=>{

if(isViewMode) return;

await updateDoc(doc(db,"tasks",id),{
completed:!val
});

};

/* ========= ADD ========= */
window.openAddPopup=()=>{

if(isViewMode) return;

$("addPopup").classList.add("show");

};

window.closeAddPopup=()=>{
$("addPopup").classList.remove("show");
};

window.selectAddType = async(type)=>{

if(isViewMode) return;

let txt = prompt("Enter "+type);

if(!txt) return;

if(type==="task"){

await addDoc(collection(db,"tasks"),{
user:realUid,
text:txt,
date:new Date().toLocaleDateString("en-CA"),
time:"00:00",
completed:false
});

}else if(type==="goal"){

await addDoc(collection(db,"goals"),{
user:realUid,
name:txt,
done:0,
total:10
});

}else{

await addDoc(collection(db,type),{
uid:realUid,
text:txt,
createdAt:Date.now()
});

}

closeAddPopup();

};

/* ========= CUSTOM ========= */
window.openCustomizer=()=>{

if(isViewMode) return;

$("customPopup").classList.add("show");

};

window.closeCustomizer=()=>{
$("customPopup").classList.remove("show");
};

window.saveLayout = async()=>{

if(isViewMode) return;

let arr=[];

document.querySelectorAll(
"#customPopup input[type=checkbox]"
).forEach(x=>{

if(x.checked)
arr.push(x.value);

});

layout=arr;

await saveDashboardSettings();

closeCustomizer();
render();

};

/* ========= DRAG + RESIZE ========= */
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

/* resize save */
const ro =
new ResizeObserver(async()=>{

widgetSizes[card.dataset.id]={
width:card.style.width ||
getComputedStyle(card).width,

height:card.style.height ||
getComputedStyle(card).height
};

await saveDashboardSettings();

});

ro.observe(card);

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
