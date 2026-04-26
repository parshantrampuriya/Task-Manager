/* ================= ULTIMATE HOME.JS FINAL ================= */

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
deleteDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let uid=null;
let tasks=[];
let goals=[];
let stats={
mistakes:0,
insights:0,
quest:0,
smart:0
};

let layout=
JSON.parse(localStorage.getItem("dashLayout")) || [
"focus","tasks","quote","goals","growth"
];

/* ================= AUTH ================= */

onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

uid=user.uid;

const u=await getDoc(doc(db,"users",uid));

if(u.exists()){
username.innerText=
"Welcome "+(u.data().name || "");
}

loadLive();
setTopDate();
startTimer();

});

/* ================= TOP DATE ================= */

function setTopDate(){

const d=new Date();

todayDate.innerText=
d.toDateString();

}

function startTimer(){

setInterval(()=>{

let now=new Date();

let end=new Date();
end.setHours(23,59,59,999);

let diff=end-now;

let h=Math.floor(diff/3600000);
let m=Math.floor((diff%3600000)/60000);
let s=Math.floor((diff%60000)/1000);

countdownText.innerText=
`⏳ ${h}h ${m}m ${s}s remaining today`;

},1000);

}

/* ================= LOAD DATA ================= */

function loadLive(){

onSnapshot(collection(db,"tasks"),snap=>{

tasks=[];

snap.forEach(d=>{
let x=d.data();
if(x.user===uid)
tasks.push({id:d.id,...x});
});

renderDashboard();

});

onSnapshot(collection(db,"goals"),snap=>{

goals=[];

snap.forEach(d=>{
let x=d.data();
if(x.user===uid)
goals.push({id:d.id,...x});
});

renderDashboard();

});

loadCounts();

}

async function loadCounts(){

stats.mistakes=
await getCount("mistakes");

stats.insights=
await getCount("insights");

stats.quest=
await getCount("quest");

stats.smart=
await getCount("smartmoves");

renderDashboard();

}

async function getCount(name){

const snap=await getDocs(collection(db,name));

let c=0;

snap.forEach(d=>{
if(d.data().uid===uid) c++;
});

return c;

}

/* ================= RENDER ================= */

function renderDashboard(){

dashboardGrid.innerHTML="";

layout.forEach(type=>{

if(type==="focus")
dashboardGrid.appendChild(focusCard());

if(type==="tasks")
dashboardGrid.appendChild(taskCard());

if(type==="quote")
dashboardGrid.appendChild(quoteCard());

if(type==="goals")
dashboardGrid.appendChild(goalCard());

if(type==="growth")
dashboardGrid.appendChild(growthCard());

});

enableDrag();

}

/* ================= CARD BUILDER ================= */

function cardBase(title,id,wide=false){

let div=document.createElement("div");

div.className=
"widget-card "+(wide?"full-card":"compact");

div.draggable=true;
div.dataset.id=id;

div.innerHTML=`

<div class="card-head drag-handle">
<h3>${title}</h3>
</div>

<div class="widget-body" id="${id}Body"></div>

<div class="resize-handle"></div>

`;

enableResize(div);

return div;

}

/* ================= FOCUS ================= */

function focusCard(){

let done=
tasks.filter(x=>x.completed).length;

let total=tasks.length;

let p=total?
Math.round(done*100/total):0;

let c=cardBase("📊 Today Focus","focus");

c.querySelector("#focusBody").innerHTML=`

<div class="big-number">${p}%</div>

<div class="progress">
<div class="progress-fill"
style="width:${p}%"></div>
</div>

<div class="small-muted">
${done}/${total} completed
</div>

`;

return c;

}

/* ================= TASKS ================= */

function taskCard(){

let c=cardBase("📋 Today Tasks","tasks",true);

let today=
new Date().toLocaleDateString("en-CA");

let arr=
tasks.filter(x=>x.date===today);

arr.sort((a,b)=>{

if(a.completed!==b.completed)
return a.completed?1:-1;

return (a.time||"")
.localeCompare(b.time||"");

});

let html="";

arr.forEach(x=>{

html+=`

<div class="task-row ${x.completed?'task-done':''}">

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

c.querySelector("#tasksBody").innerHTML=
html || "No task";

return c;

}

/* ================= QUOTE ================= */

function quoteCard(){

let q=[
"Discipline today creates freedom tomorrow.",
"Small progress daily beats excuses.",
"Win the morning win the day.",
"Consistency creates success.",
"Action cures fear."
];

let random=
q[Math.floor(Math.random()*q.length)];

let c=cardBase("💬 Quote","quote");

c.querySelector("#quoteBody").innerHTML=`

<div class="quote-box">
${random}
</div>

`;

return c;

}

/* ================= GOALS ================= */

function goalCard(){

let c=cardBase("🎯 Goals","goals");

let html="";

goals.forEach(g=>{

let p=Math.round(
((g.done||0)/(g.total||1))*100
);

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

c.querySelector("#goalsBody").innerHTML=
html || "No goals";

return c;

}

/* ================= GROWTH ================= */

function growthCard(){

let c=cardBase("🌱 Growth Summary","growth");

c.querySelector("#growthBody").innerHTML=`

<div class="summary-row">
<span>Mistakes</span>
<b>${stats.mistakes}</b>
</div>

<div class="summary-row">
<span>Insights</span>
<b>${stats.insights}</b>
</div>

<div class="summary-row">
<span>Quest</span>
<b>${stats.quest}</b>
</div>

<div class="summary-row">
<span>Smart Moves</span>
<b>${stats.smart}</b>
</div>

`;

return c;

}

/* ================= TASK TOGGLE ================= */

window.toggleTask=async(id,v)=>{

await updateDoc(doc(db,"tasks",id),{
completed:!v
});

};

/* ================= DRAG ORDER ================= */

function enableDrag(){

let drag=null;

document.querySelectorAll(".widget-card")
.forEach(card=>{

card.addEventListener("dragstart",()=>{
drag=card;
});

card.addEventListener("dragover",e=>{
e.preventDefault();
});

card.addEventListener("drop",()=>{

if(drag===card) return;

dashboardGrid.insertBefore(
drag,
card
);

saveOrder();

});

});

}

function saveOrder(){

layout=[];

document.querySelectorAll(".widget-card")
.forEach(x=>{
layout.push(x.dataset.id);
});

localStorage.setItem(
"dashLayout",
JSON.stringify(layout)
);

}

/* ================= RESIZE ================= */

function enableResize(card){

let handle=
card.querySelector(".resize-handle");

let startX,startY,startW,startH;

handle.onmousedown=e=>{

e.preventDefault();

startX=e.clientX;
startY=e.clientY;

startW=parseInt(
document.defaultView.getComputedStyle(card).width,10);

startH=parseInt(
document.defaultView.getComputedStyle(card).height,10);

document.onmousemove=drag;
document.onmouseup=stop;

};

function drag(e){

card.style.width=
(startW+e.clientX-startX)+"px";

card.style.height=
(startH+e.clientY-startY)+"px";

}

function stop(){

document.onmousemove=null;
document.onmouseup=null;

}

}

/* ================= ADD POPUP ================= */

window.openAddPopup=()=>{
addPopup.classList.add("show");
};

window.closeAddPopup=()=>{
addPopup.classList.remove("show");
};

window.selectAddType=async(type)=>{

let txt=
prompt("Enter "+type);

if(!txt) return;

if(type==="task"){

await addDoc(collection(db,"tasks"),{
user:uid,
text:txt,
date:new Date()
.toLocaleDateString("en-CA"),
time:"00:00",
completed:false
});

}

else if(type==="goal"){

await addDoc(collection(db,"goals"),{
user:uid,
name:txt,
done:0,
total:10
});

}

else{

await addDoc(collection(db,type==="smart"?"smartmoves":type),{
uid:uid,
text:txt,
date:new Date()
.toLocaleDateString("en-CA"),
createdAt:Date.now()
});

}

closeAddPopup();

};

/* ================= CUSTOM ================= */

window.openCustomizer=()=>{
customPopup.classList.add("show");
};

window.closeCustomizer=()=>{
customPopup.classList.remove("show");
};

window.saveLayout=()=>{

let arr=[];

document.querySelectorAll(
"#customPopup input[type=checkbox]"
).forEach(x=>{
if(x.checked)
arr.push(x.value);
});

layout=arr;

localStorage.setItem(
"dashLayout",
JSON.stringify(layout)
);

closeCustomizer();
renderDashboard();

};

/* ================= LOGOUT ================= */

logoutBtn.onclick=async()=>{

await signOut(auth);

location.href="index.html";

};
