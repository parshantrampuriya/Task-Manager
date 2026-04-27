/* home.js FINAL UPDATED (sync resize + layout across phone/laptop) */

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

/* ========= GLOBAL ========= */
let uid = null;
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

uid = user.uid;

/* user name */
const snap = await getDoc(doc(db,"users",uid));
if(snap.exists()){
$("username").innerText =
"Welcome " + (snap.data().name || "");
}

/* load dashboard settings from cloud */
await loadDashboardSettings();

setDate();
startTimer();
loadLive();

});

/* ========= CLOUD SETTINGS ========= */
async function loadDashboardSettings(){

const snap = await getDoc(doc(db,"dashboardSettings",uid));

if(snap.exists()){

const d = snap.data();

if(Array.isArray(d.layout))
layout = d.layout;

if(d.widgetSizes)
widgetSizes = d.widgetSizes;

}

}

async function saveDashboardSettings(){

await setDoc(
doc(db,"dashboardSettings",uid),
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

const h = Math.floor(diff/3600000);
const m = Math.floor((diff%3600000)/60000);
const s = Math.floor((diff%60000)/1000);

$("countdownText").innerText =
`⏳ ${h}h ${m}m ${s}s remaining today`;

},1000);

}

/* ========= LOAD ========= */
function loadLive(){

onSnapshot(collection(db,"tasks"), snap=>{

tasks=[];

snap.forEach(d=>{
let x=d.data();
if(x.user===uid)
tasks.push({id:d.id,...x});
});

render();

});

onSnapshot(collection(db,"goals"), snap=>{

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

counts.mistakes = await getCollectionCount("mistakes");
counts.insights = await getCollectionCount("insights");
counts.quest = await getCollectionCount("quest");
counts.smartmoves = await getCollectionCount("smartmoves");

render();

}

async function getCollectionCount(name){

const snap = await getDocs(collection(db,name));

let c=0;

snap.forEach(d=>{
if(d.data().uid===uid) c++;
});

return c;

}

/* ========= RENDER ========= */
function render(){

const grid = $("dashboardGrid");
grid.innerHTML = "";

layout.forEach(type=>{

if(type==="focus") grid.appendChild(focusCard());
if(type==="tasks") grid.appendChild(taskCard());
if(type==="quote") grid.appendChild(quoteCard());
if(type==="goals") grid.appendChild(goalCard());
if(type==="growth") grid.appendChild(growthCard());

});

enableDragAndResize();

}

/* ========= BASE CARD ========= */
function makeCard(title,id,wide=false){

const div = document.createElement("div");

div.className =
"widget-card " + (wide ? "full-card":"");

div.dataset.id=id;
div.draggable=true;

div.innerHTML=`
<div class="card-head">
<h3>${title}</h3>
</div>
<div class="widget-body"></div>
`;

/* apply saved size */
if(widgetSizes[id]){
div.style.width = widgetSizes[id].width || "";
div.style.height = widgetSizes[id].height || "";
}

return div;

}

/* ========= WIDGETS ========= */

function focusCard(){

const card = makeCard("📊 Today Focus","focus");

const today = getTodayTasks();

const done = today.filter(x=>x.completed).length;
const total = today.length;

const p = total ? Math.round(done*100/total):0;

card.querySelector(".widget-body").innerHTML=`
<div class="big-number">${p}%</div>
<div class="progress">
<div class="progress-fill" style="width:${p}%"></div>
</div>
<div class="small-muted">${done}/${total} completed</div>
`;

return card;
}

function taskCard(){

const card = makeCard("📋 Today Tasks","tasks",true);

let arr = getTodayTasks();

arr.sort((a,b)=>{
if(a.completed!==b.completed)
return a.completed ? 1 : -1;

return (a.time||"").localeCompare(b.time||"");
});

let html="";

arr.forEach(x=>{

html+=`
<div class="task-row ${x.completed?'task-done':''}">

<div class="task-left">
<div class="task-title">${x.text}</div>
<div class="task-time">${x.time || "00:00"}</div>
</div>

<button class="tick-btn"
onclick="toggleTask('${x.id}',${x.completed})">
✔
</button>

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

const text = q[Math.floor(Math.random()*q.length)];

const card = makeCard("💬 Quote","quote");

card.querySelector(".widget-body").innerHTML =
`<div class="quote-box">${text}</div>`;

return card;
}

function goalCard(){

const card = makeCard("🎯 Goals","goals");

let html="";

goals.forEach(g=>{

const done = Number(g.done||0);
const total = Number(g.total||0);

const p = total>0 ?
Math.round((done/total)*100):0;

html+=`
<div class="goal-row">
<div>${g.name} - ${p}%</div>

<div class="goal-bar">
<div class="goal-fill" style="width:${p}%"></div>
</div>
</div>
`;

});

card.querySelector(".widget-body").innerHTML =
html || "No goals";

return card;
}

function growthCard(){

const card = makeCard("🌱 Growth Summary","growth");

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

await updateDoc(doc(db,"tasks",id),{
completed:!val
});

};

/* ========= ADD ========= */
window.openAddPopup=()=>{
$("addPopup").classList.add("show");
};

window.closeAddPopup=()=>{
$("addPopup").classList.remove("show");
};

window.selectAddType = async(type)=>{

let txt = prompt("Enter "+type);

if(!txt) return;

if(type==="task"){

await addDoc(collection(db,"tasks"),{
user:uid,
text:txt,
date:new Date().toLocaleDateString("en-CA"),
time:"00:00",
completed:false
});

}else if(type==="goal"){

await addDoc(collection(db,"goals"),{
user:uid,
name:txt,
done:0,
total:10
});

}else{

await addDoc(collection(db,type),{
uid:uid,
text:txt,
createdAt:Date.now()
});

}

closeAddPopup();

};

/* ========= CUSTOM ========= */
window.openCustomizer=()=>{
$("customPopup").classList.add("show");
};

window.closeCustomizer=()=>{
$("customPopup").classList.remove("show");
};

window.saveLayout = async()=>{

let arr=[];

document.querySelectorAll(
"#customPopup input[type=checkbox]"
).forEach(x=>{
if(x.checked) arr.push(x.value);
});

layout = arr;

await saveDashboardSettings();

closeCustomizer();
render();

};

/* ========= DRAG + RESIZE ========= */
function enableDragAndResize(){

let drag=null;

document.querySelectorAll(".widget-card")
.forEach(card=>{

/* drag */
card.addEventListener("dragstart",()=>{
drag=card;
});

card.addEventListener("dragover",e=>{
e.preventDefault();
});

card.addEventListener("drop",async()=>{

if(drag===card) return;

$("dashboardGrid").insertBefore(drag,card);

await saveOrder();

});

/* resize observer */
const ro = new ResizeObserver(async()=>{

widgetSizes[card.dataset.id]={
width:card.style.width || getComputedStyle(card).width,
height:card.style.height || getComputedStyle(card).height
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