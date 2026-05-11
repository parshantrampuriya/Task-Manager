/* ================= FIREBASE IMPORTS ================= */
import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
deleteDoc,
updateDoc,
doc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */
let currentUser = null;
let tasks = [];
let currentTab = "pending";

let currentTaskId = null;
let currentAction = null;

let isViewMode = false;
let uid = null;
let realUid = null;

let quadrantFilter = "all";

/* ================= AUTH ================= */
onAuthStateChanged(auth,(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

realUid = user.uid;
uid = user.uid;

loadTasks();

});

/* ================= LOAD TASKS ================= */
function loadTasks(){

onSnapshot(collection(db,"tasks"),(snap)=>{

tasks = [];

snap.forEach(d=>{

const t = d.data();

if(t.uid === uid || t.user === uid){

tasks.push({
id:d.id,
...t
});

}

});

render();

});

}

/* ================= TODAY ================= */
function getToday(){

return new Date()
.toISOString()
.split("T")[0];

}

/* ================= SORT ================= */
function sortDates(dates){

return dates.sort((a,b)=>{

if(currentTab==="pending"){
return new Date(a)-new Date(b);
}else{
return new Date(b)-new Date(a);
}

});

}

/* ================= ESCAPE ================= */
function escapeText(t){

return encodeURIComponent(t || "");

}

/* ================= STATUS ================= */
function getStatus(t){

if(!t.time || t.time==="00:00")
return "";

let now = new Date();

let taskTime =
new Date(`${t.date}T${t.time}`);

let diff = taskTime-now;

if(diff < 0) return "overdue";

if(diff < 30*60000)
return "urgent-status";

if(diff < 60*60000)
return "soon";

return "";

}

/* ================= TAB ================= */
window.switchTab = (tab,e)=>{

currentTab = tab;

document
.querySelectorAll(".tabs button")
.forEach(btn=>{
btn.classList.remove("active");
});

if(e){
e.target.classList.add("active");
}

render();

};

/* ================= QUADRANT FILTER ================= */
window.setQuadrantFilter = (type,e)=>{

quadrantFilter = type;

document
.querySelectorAll(".quad-btn")
.forEach(btn=>{
btn.classList.remove("active");
});

if(e){
e.target.classList.add("active");
}

render();

};

/* ================= ADD TASK ================= */
window.addTask = async()=>{

if(isViewMode) return;

/* SAFE INPUTS */

const taskEl =
document.getElementById("taskInput");

const dateEl =
document.getElementById("dateInput");

const timeEl =
document.getElementById("timeInput");

const importantEl =
document.getElementById("importantCheck");

const urgentEl =
document.getElementById("urgentCheck");

let text =
taskEl?.value.trim() || "";

let date =
dateEl?.value || "";

let time =
timeEl?.value || "";

const important =
importantEl?.checked || false;

const urgent =
urgentEl?.checked || false;

if(!text){

alert("Enter task");
return;

}

try{

await addDoc(collection(db,"tasks"),{

text:text,
date:date || getToday(),
time:time || "00:00",

important:important,
urgent:urgent,

completed:false,
user:realUid,
uid:realUid,
createdAt:Date.now()

});

/* CLEAR */

if(taskEl) taskEl.value="";
if(dateEl) dateEl.value="";
if(timeEl) timeEl.value="";

if(importantEl){
importantEl.checked=false;
}

if(urgentEl){
urgentEl.checked=false;
}

}catch(err){

console.log(err);

alert(
"Task add failed:\n" +
err.message
);

}

};

/* ================= PRIORITY SCORE ================= */
function getPriorityScore(t){

if(t.important && t.urgent) return 1;

if(t.important && !t.urgent) return 2;

if(!t.important && t.urgent) return 3;

return 4;

}

/* ================= QUADRANT CLASS ================= */
function getQuadrantClass(t){

if(t.important && t.urgent){
return "q1";
}

if(t.important && !t.urgent){
return "q2";
}

if(!t.important && t.urgent){
return "q3";
}

return "q4";

}

/* ================= PRIORITY BADGE ================= */
function getPriorityBadge(t){

if(t.important && t.urgent){

return `
<span class="badge urgent">
🔥 Critical
</span>
`;

}

if(t.important){

return `
<span class="badge important">
⭐ Important
</span>
`;

}

if(t.urgent){

return `
<span class="badge quest">
⚡ Urgent
</span>
`;

}

return `
<span class="badge">
🧩 Normal
</span>
`;

}

/* ================= UPDATE STATS ================= */
function updateStats(todayTasks){

let critical=0;
let important=0;
let completed=0;
let pending=0;

let earnedPoints = 0;
let totalPoints = 0;

todayTasks.forEach(t=>{

if(t.completed){
completed++;
}else{
pending++;
}

if(t.important && t.urgent){
critical++;
}

if(t.important && !t.urgent){
important++;
}

/* PRODUCTIVITY WEIGHT */

let points = 1;

if(t.important && t.urgent){

points = 4;

}else if(t.important){

points = 3;

}else if(t.urgent){

points = 2;

}

totalPoints += points;

if(t.completed){

earnedPoints += points;

}

});

/* UPDATE CARDS */

const criticalEl =
document.getElementById("criticalCount");

const importantEl =
document.getElementById("importantCount");

const completedEl =
document.getElementById("completedCount");

const pendingEl =
document.getElementById("pendingCount");

if(criticalEl){
criticalEl.innerText = critical;
}

if(importantEl){
importantEl.innerText = important;
}

if(completedEl){
completedEl.innerText = completed;
}

if(pendingEl){
pendingEl.innerText = pending;
}

/* PRODUCTIVITY */

let percent = totalPoints
? Math.round(
(earnedPoints / totalPoints) * 100
)
: 0;

/* BAR */

const fill =
document.getElementById("progressFill");

if(fill){

fill.style.width =
percent + "%";

}

/* TEXT */

const productivityText =
document.getElementById("productivityText");

if(productivityText){

productivityText.innerText =
percent + "%";

}

}

/* ================= CLEAR COMPLETED ================= */
window.clearCompleted = async()=>{

let doneTasks =
tasks.filter(t=>t.completed);

if(doneTasks.length===0){

alert("No completed tasks");
return;

}

let ok = confirm(
`Delete ${doneTasks.length} completed tasks?`
);

if(!ok) return;

for(const t of doneTasks){

await deleteDoc(
doc(db,"tasks",t.id)
);

}

};

/* ================= RENDER ================= */
function render(){

let today = getToday();

const searchEl =
document.getElementById("searchInput");

let search =
searchEl?.value.toLowerCase() || "";

/* TODAY TASKS */

const todayTasks = tasks.filter(t=>
t.date === today
);

/* FILTERED */

let filtered = tasks.filter(t=>
(t.text || "")
.toLowerCase()
.includes(search)
);

/* QUADRANT FILTER */

if(quadrantFilter==="critical"){

filtered = filtered.filter(t=>
t.important && t.urgent
);

}

if(quadrantFilter==="important"){

filtered = filtered.filter(t=>
t.important && !t.urgent
);

}

if(quadrantFilter==="urgent"){

filtered = filtered.filter(t=>
!t.important && t.urgent
);

}

if(quadrantFilter==="normal"){

filtered = filtered.filter(t=>
!t.important && !t.urgent
);

}

/* TABS */

if(currentTab==="pending"){

filtered = filtered.filter(t=>
!t.completed &&
t.date >= today
);

}

if(currentTab==="due"){

filtered = filtered.filter(t=>
!t.completed &&
t.date < today
);

}

if(currentTab==="completed"){

filtered = filtered.filter(t=>
t.completed
);

}

/* UPDATE STATS */

updateStats(todayTasks);

/* GROUP */

let grouped = {};

filtered.forEach(t=>{

if(!grouped[t.date]){
grouped[t.date]=[];
}

grouped[t.date].push(t);

});

/* HTML */

let html = "";

let dates =
sortDates(Object.keys(grouped));

dates.forEach(date=>{

let dayName =
new Date(date)
.toLocaleDateString("en-US",{
weekday:"long"
});

html += `
<div class="date-group">

<h3>
📅 ${dayName} (${date})
</h3>

<ol class="task-list">
`;

grouped[date].sort((a,b)=>{

let pa = getPriorityScore(a);
let pb = getPriorityScore(b);

if(pa!==pb){
return pa-pb;
}

return (a.time || "")
.localeCompare(b.time || "");

});

grouped[date].forEach(t=>{

let status =
getStatus(t);

let quadClass =
getQuadrantClass(t);

html += `
<li class="task-item ${quadClass} ${t.completed?'done':''} ${status}">

<div class="task-left">

<div class="task-title">
${t.text}
</div>

${getPriorityBadge(t)}

${
t.time && t.time!=="00:00"
?
`<div class="task-time">🕒 ${t.time}</div>`
:
""
}

</div>

<div class="task-actions">

<button onclick="toggle('${t.id}',${t.completed})">
✔
</button>

<button onclick="openModal(
'edit',
'${t.id}',
'${escapeText(t.text)}',
'${t.date}',
'${t.time || ""}'
)">
✏️
</button>

<button onclick="openModal('delete','${t.id}')">
❌
</button>

</div>

</li>
`;

});

html += `
</ol>
</div>
`;

});

/* SHOW */

const container =
document.getElementById("taskContainer");

if(container){

container.innerHTML =
html || "<p>No tasks found.</p>";

}

}

/* ================= TOGGLE ================= */
window.toggle = async(id,c)=>{

await updateDoc(
doc(db,"tasks",id),
{
completed:!c
}
);

};

/* ================= MODAL ================= */
window.openModal=(type,id,text="",date="",time="")=>{

currentTaskId=id;
currentAction=type;

modal.classList.add("active");

modalInput.style.display="block";
modalDate.style.display="block";
modalTime.style.display="block";

if(type==="edit"){

modalTitle.innerText="Edit Task";

modalInput.value =
decodeURIComponent(text);

modalDate.value=date;
modalTime.value=time;

let task =
tasks.find(x=>x.id===id);

if(task){

document.getElementById("modalImportant").checked =
task.important || false;

document.getElementById("modalUrgent").checked =
task.urgent || false;

}

}

if(type==="delete"){

modalTitle.innerText =
"Delete this task?";

modalInput.style.display="none";
modalDate.style.display="none";
modalTime.style.display="none";

}

};

/* ================= CLOSE MODAL ================= */
window.closeModal=()=>{

modal.classList.remove("active");

};

/* ================= CONFIRM ================= */
window.confirmAction=async()=>{

if(currentAction==="edit"){

await updateDoc(
doc(db,"tasks",currentTaskId),
{
text:modalInput.value.trim(),
date:modalDate.value,
time:modalTime.value || "00:00",

important:
document.getElementById("modalImportant")?.checked || false,

urgent:
document.getElementById("modalUrgent")?.checked || false
}
);

}

if(currentAction==="delete"){

await deleteDoc(
doc(db,"tasks",currentTaskId)
);

}

closeModal();

};

/* ================= SEARCH ================= */

const searchInputEl =
document.getElementById("searchInput");

if(searchInputEl){

searchInputEl.addEventListener(
"input",
render
);

}
