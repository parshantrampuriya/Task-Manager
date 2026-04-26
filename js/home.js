// ================= HOME JS V2 =================

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
addDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const $ = (id)=>document.getElementById(id);

let currentUser = null;
let addType = "task";

let widgets = {
focus:true,
tasks:true,
goals:true,
mistakes:true,
insights:true,
quest:true,
countdown:true,
quote:true
};

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

await loadUser();
await loadWidgetSettings();

setToday();
renderDashboard();
startClock();

});

/* ================= USER ================= */

async function loadUser(){

const snap = await getDoc(
doc(db,"users",currentUser.uid)
);

if(snap.exists()){

$("username").innerText =
"👤 Welcome " +
(snap.data().name || "User");

}

}

/* ================= DATE ================= */

function setToday(){

const d = new Date();

$("todayDate").innerText =
d.toDateString();

$("addDate").value =
d.toISOString().split("T")[0];

}

/* ================= SETTINGS ================= */

async function loadWidgetSettings(){

const ref = doc(
db,
"dashboardSettings",
currentUser.uid
);

const snap = await getDoc(ref);

if(snap.exists()){

widgets = {
...widgets,
...snap.data()
};

}

document
.querySelectorAll("[data-widget]")
.forEach(x=>{

x.checked =
widgets[x.dataset.widget];

});

}

window.openCustomize = ()=>{
$("customPopup").classList.add("show");
};

window.closeCustomize = ()=>{
$("customPopup").classList.remove("show");
};

window.saveWidgets = async()=>{

document
.querySelectorAll("[data-widget]")
.forEach(x=>{

widgets[x.dataset.widget] =
x.checked;

});

await setDoc(
doc(db,"dashboardSettings",currentUser.uid),
widgets
);

closeCustomize();
toast("Saved ✅");

renderDashboard();

};

/* ================= DASHBOARD ================= */

async function renderDashboard(){

let html = "";

if(widgets.focus)
html += await focusCard();

if(widgets.countdown)
html += countdownCard();

if(widgets.quote)
html += quoteCard();

if(widgets.tasks)
html += await tasksCard();

if(widgets.goals)
html += await goalsCard();

if(widgets.mistakes)
html += await mistakesCard();

if(widgets.insights)
html += await insightsCard();

if(widgets.quest)
html += await questCard();

$("dashboardGrid").innerHTML = html;

}

/* ================= FOCUS ================= */

async function focusCard(){

const snap = await getDocs(
collection(db,"tasks")
);

let total=0;
let done=0;

snap.forEach(d=>{

let t=d.data();

if(t.user===currentUser.uid){

let today = new Date()
.toLocaleDateString("en-CA");

if(t.date===today){

total++;

if(t.completed) done++;

}

}

});

let per = total ? Math.round((done/total)*100) : 0;

return `
<div class="widget-card">
<div class="card-head">
<h3>📅 Today Focus</h3>
</div>

<div class="big-number">${per}%</div>

<div class="progress">
<div class="progress-fill"
style="width:${per}%">
</div>
</div>

<div class="small-muted">
${done}/${total} tasks completed
</div>

</div>
`;

}

/* ================= COUNTDOWN ================= */

function countdownCard(){

return `
<div class="widget-card">
<div class="card-head">
<h3>⏳ Countdown</h3>
</div>

<div id="liveClock"
class="big-number">--</div>

<div class="small-muted">
Day ends soon
</div>
</div>
`;

}

function startClock(){

setInterval(()=>{

let box = $("liveClock");
if(!box) return;

let now = new Date();
let end = new Date();

end.setHours(23,59,59,999);

let diff = end-now;

let h = Math.floor(diff/3600000);
let m = Math.floor((diff%3600000)/60000);
let s = Math.floor((diff%60000)/1000);

box.innerText =
`${h}h ${m}m ${s}s`;

},1000);

}

/* ================= QUOTE ================= */

function quoteCard(){

const arr = [
"Discipline beats mood.",
"Small wins daily.",
"Finish what matters.",
"Focus creates power.",
"Consistency wins."
];

let q =
arr[new Date().getDate()%arr.length];

return `
<div class="widget-card">
<div class="card-head">
<h3>🧠 Focus Quote</h3>
</div>

<div class="item-title">
${q}
</div>

</div>
`;

}

/* ================= TASKS ================= */

async function tasksCard(){

const snap = await getDocs(
collection(db,"tasks")
);

let rows = "";
let today = new Date()
.toLocaleDateString("en-CA");

snap.forEach(d=>{

let t=d.data();

if(
t.user===currentUser.uid &&
t.date===today
){

rows += `
<div class="item-row">

<div class="item-left">
<div class="item-title">
${t.completed ? "✔ " : ""}${t.text}
</div>
<div class="item-sub">
${t.time || ""}
</div>
</div>

<button class="icon-btn"
onclick="toggleTask('${d.id}',${t.completed})">
✔
</button>

</div>
`;

}

});

if(!rows)
rows=`<div class="small-muted">No tasks</div>`;

return `
<div class="widget-card full-card">

<div class="card-head">
<h3>📋 Today Tasks</h3>
</div>

${rows}

</div>
`;

}

window.toggleTask = async(id,val)=>{

await updateDoc(
doc(db,"tasks",id),
{
completed:!val
}
);

renderDashboard();

};

/* ================= GOALS ================= */

async function goalsCard(){

const snap = await getDocs(
collection(db,"goals")
);

let rows="";

snap.forEach(d=>{

let g=d.data();

if(g.user===currentUser.uid){

let p=Math.round(
(g.done/g.total)*100 || 0
);

rows += `
<div class="item-row">
<div class="item-left">

<div class="item-title">
${g.name}
</div>

<div class="progress">
<div class="progress-fill"
style="width:${p}%">
</div>
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

/* ================= COUNTS ================= */

async function mistakesCard(){
return countCard("mistakes","uid","❌ Mistakes");
}

async function insightsCard(){
return countCard("insights","uid","🧠 Insights");
}

async function questCard(){
return countCard("quest","uid","❓ Quest");
}

async function countCard(col,key,title){

const snap=await getDocs(
collection(db,col)
);

let c=0;

snap.forEach(d=>{
if(d.data()[key]===currentUser.uid)
c++;
});

return `
<div class="widget-card">
<div class="card-head">
<h3>${title}</h3>
</div>

<div class="big-number">${c}</div>

<div class="small-muted">
Total records
</div>

</div>
`;

}

/* ================= ADD POPUP ================= */

window.openAddPopup=()=>{
$("addPopup").classList.add("show");
backToTypes();
};

window.closeAddPopup=()=>{
$("addPopup").classList.remove("show");
};

window.selectAddType=(type)=>{

addType=type;

$("typeSelect").style.display="none";
$("dynamicForm").style.display="block";

$("popupMainTitle").innerText =
"➕ Add " +
type.charAt(0).toUpperCase() +
type.slice(1);

$("addTarget").style.display =
type==="goal" ? "block":"none";

$("addTime").style.display =
type==="task" ? "block":"none";

$("addPriority").style.display =
type==="task" ? "block":"none";

};

window.backToTypes=()=>{

$("typeSelect").style.display="block";
$("dynamicForm").style.display="none";

$("popupMainTitle").innerText =
"➕ Add New";

};

window.saveGlobalItem=async()=>{

let text=$("addText").value.trim();

if(!text) return toast("Enter text");

let date=$("addDate").value;
let time=$("addTime").value;
let target=$("addTarget").value;

if(addType==="task"){

await addDoc(collection(db,"tasks"),{
text,
date,
time:time || "00:00",
priority:$("addPriority").value,
completed:false,
user:currentUser.uid
});

}

if(addType==="goal"){

await addDoc(collection(db,"goals"),{
name:text,
total:Number(target || 1),
done:0,
deadline:date,
user:currentUser.uid
});

}

if(addType==="mistake"){

await addDoc(collection(db,"mistakes"),{
text,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

if(addType==="insight"){

await addDoc(collection(db,"insights"),{
text,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

if(addType==="quest"){

await addDoc(collection(db,"quest"),{
text,
date,
uid:currentUser.uid,
status:"Pending",
createdAt:Date.now()
});

}

$("addText").value="";

closeAddPopup();
toast("Saved ✅");

renderDashboard();

};

/* ================= DAY MODES ================= */

window.morningMode=()=>{
toast("Win your day 🔥");
};

window.nightReview=()=>{
$("reviewPopup").classList.add("show");
};

window.closeReview=()=>{
$("reviewPopup").classList.remove("show");
};

window.submitReview=async()=>{

let m=$("reviewMistake").value.trim();
let i=$("reviewInsight").value.trim();

let date=new Date()
.toISOString().split("T")[0];

if(m){

await addDoc(collection(db,"mistakes"),{
text:m,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

if(i){

await addDoc(collection(db,"insights"),{
text:i,
date,
uid:currentUser.uid,
createdAt:Date.now()
});

}

closeReview();
toast("Review Saved 🌙");
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

$("logoutBtn").onclick=async()=>{

await signOut(auth);
location.href="index.html";

};
