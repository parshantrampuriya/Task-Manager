import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
updateDoc,
addDoc,
deleteDoc,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   URL PARAMS
========================= */

const urlParams =
new URLSearchParams(
window.location.search
);

const goalId =
urlParams.get("id");

/* =========================
   ELEMENTS
========================= */

const goalTitle =
document.getElementById(
"goalTitle"
);

const goalDescription =
document.getElementById(
"goalDescription"
);

const milestoneContainer =
document.getElementById(
"milestoneContainer"
);

const createMilestoneBtn =
document.getElementById(
"createMilestoneBtn"
);

const milestoneModal =
document.getElementById(
"milestoneModal"
);

const saveMilestoneBtn =
document.getElementById(
"saveMilestoneBtn"
);

const cancelMilestoneBtn =
document.getElementById(
"cancelMilestoneBtn"
);

const searchInput =
document.getElementById(
"searchInput"
);

/* =========================
   STATE
========================= */

let currentUser = null;

let currentGoal = null;

let milestones = [];

let editMilestoneId = null;

/* =========================
   AUTH
========================= */

onAuthStateChanged(
auth,
async(user)=>{

if(!user){

window.location.href =
"index.html";

return;

}

currentUser = user;

await loadGoal();

await loadMilestones();

}
);

/* =========================
   LOAD GOAL
========================= */

async function loadGoal(){

try{

const goalRef =
doc(
db,
"goals",
goalId
);

const goalSnap =
await getDoc(
goalRef
);

if(!goalSnap.exists()){

alert(
"Goal not found"
);

return;

}

currentGoal = {

id:goalSnap.id,

...goalSnap.data()

};

goalTitle.innerText =
currentGoal.name || "";

goalDescription.innerText =
currentGoal.description ||
"No description";

}catch(error){

console.error(error);

}

}

/* =========================
   LOAD MILESTONES
========================= */

async function loadMilestones(){

try{

const milestoneRef =
collection(
db,
"goals",
goalId,
"milestones"
);

const snapshot =
await getDocs(
milestoneRef
);

milestones = [];

snapshot.forEach(docSnap=>{

milestones.push({

id:docSnap.id,

...docSnap.data()

});

});

renderMilestones();

updateGoalStats();

}catch(error){

console.error(error);

}

}

/* =========================
   OPEN MODAL
========================= */

createMilestoneBtn.onclick =
()=>{

editMilestoneId = null;

document.getElementById(
"modalTitle"
).innerText =
"➕ Create Milestone";

document.getElementById(
"milestoneName"
).value = "";

document.getElementById(
"targetValue"
).value = "";

document.getElementById(
"unitType"
).value = "Pages";

document.getElementById(
"startDate"
).value = "";

document.getElementById(
"endDate"
).value = "";

milestoneModal.style.display =
"flex";

};

/* =========================
   CLOSE MODAL
========================= */

cancelMilestoneBtn.onclick =
()=>{

milestoneModal.style.display =
"none";

};

/* =========================
   SAVE MILESTONE
========================= */

saveMilestoneBtn.onclick =
async()=>{

const name =
document.getElementById(
"milestoneName"
).value.trim();

const target =
Number(
document.getElementById(
"targetValue"
).value
);

const unit =
document.getElementById(
"unitType"
).value;

const startDate =
document.getElementById(
"startDate"
).value;

const endDate =
document.getElementById(
"endDate"
).value;

if(!name){

alert(
"Milestone name required"
);

return;

}

if(target <= 0){

alert(
"Target must be greater than 0"
);

return;

}

try{

if(editMilestoneId){

await updateDoc(

doc(
db,
"goals",
goalId,
"milestones",
editMilestoneId
),

{
name,
target,
unit,
startDate,
endDate
}

);

}else{

await addDoc(

collection(
db,
"goals",
goalId,
"milestones"
),

{
name,
target,
current:0,
unit,
progress:0,
status:"active",
startDate,
endDate,
createdAt:Date.now()
}

);

}

/* close if-else */

milestoneModal.style.display =
"none";

await loadMilestones();

}catch(error){

console.error(error);

alert(
"Error saving milestone"
);

}

};

/* =========================
   RENDER MILESTONES
========================= */

function renderMilestones(){

const search =
searchInput.value
.toLowerCase();

milestoneContainer.innerHTML =
"";

const filtered =
milestones.filter(m =>
m.name
.toLowerCase()
.includes(search)
);

if(filtered.length === 0){

milestoneContainer.innerHTML = `

<div class="milestone-card">

<h3>No Milestones Yet</h3>

<p>Create your first milestone</p>

</div>

`;

return;

}

filtered.forEach(m=>{

let status = "active";

if(m.progress >= 100){

status = "completed";

}
else if(
m.endDate &&
new Date(m.endDate)
<
new Date()
){

status = "overdue";

}

const card =
document.createElement("div");

card.className =
"milestone-card";

card.innerHTML = `

<div class="milestone-title">

${m.name}

</div>

<div class="milestone-info">

🎯 Target:
${m.target}
${m.unit}

</div>

<div class="milestone-info">

📈 Current:
${m.current || 0}
${m.unit}

</div>

<div class="milestone-info">

📅 Start:
${m.startDate || "-"}

</div>

<div class="milestone-info">

🏁 End:
${m.endDate || "-"}

</div>

<div class="milestone-progress">

<div
class="milestone-progress-bar">

<div
class="milestone-progress-fill"
style="width:${m.progress || 0}%">

</div>

</div>

</div>

<div class="milestone-info">

Progress:
${m.progress || 0}%

</div>

<div class="
milestone-status
status-${status}
">

${status}

</div>

<div class="milestone-actions">

<button
class="update-btn"
data-id="${m.id}">

➕ Update

</button>

<button
class="edit-progress-btn"
data-id="${m.id}">

✏ Progress

</button>

<button
class="edit-btn"
data-id="${m.id}">

⚙ Edit

</button>

<button
class="delete-btn"
data-id="${m.id}">

🗑 Delete

</button>

</div>

`;

milestoneContainer
.appendChild(card);

});

/* =========================
   BUTTON EVENTS
========================= */

document
.querySelectorAll(
".edit-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

const milestone =
milestones.find(
m => m.id ===
btn.dataset.id
);

openEditMilestone(
milestone
);

};

});

document
.querySelectorAll(
".delete-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

deleteMilestone(
btn.dataset.id
);

};

});

document
.querySelectorAll(
".update-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

openUpdateProgress(
btn.dataset.id
);

};

});

document
.querySelectorAll(
".edit-progress-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

openEditProgress(
btn.dataset.id
);

};

});

}

/* =========================
   EDIT MILESTONE
========================= */

function openEditMilestone(
milestone
){

editMilestoneId =
milestone.id;

document.getElementById(
"modalTitle"
).innerText =
"✏ Edit Milestone";

document.getElementById(
"milestoneName"
).value =
milestone.name;

document.getElementById(
"targetValue"
).value =
milestone.target;

document.getElementById(
"unitType"
).value =
milestone.unit;

document.getElementById(
"startDate"
).value =
milestone.startDate || "";

document.getElementById(
"endDate"
).value =
milestone.endDate || "";

milestoneModal.style.display =
"flex";

}

/* =========================
   DELETE MILESTONE
========================= */

async function deleteMilestone(
id
){

const ok =
confirm(
"Delete milestone?"
);

if(!ok) return;

try{

await deleteDoc(

doc(
db,
"goals",
goalId,
"milestones",
id
)

);

await loadMilestones();

}catch(error){

console.error(error);

}

}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
"input",
renderMilestones
);

/* =========================
   GOAL STATS
========================= */

function updateGoalStats(){

const active =
milestones.filter(
m => (m.progress || 0)
< 100
).length;

const completed =
milestones.filter(
m => (m.progress || 0)
>= 100
).length;

const overdue =
milestones.filter(m=>{

if(!m.endDate)
return false;

return (
new Date(m.endDate)
<
new Date()
&&
(m.progress || 0)
< 100
);

}).length;

let goalProgress = 0;

if(
milestones.length > 0
){

goalProgress =
Math.round(

milestones.reduce(
(sum,m)=>
sum +
(m.progress || 0),
0
)
/ milestones.length

);

}

document.getElementById(
"activeMilestones"
).innerText =
active;

document.getElementById(
"completedMilestones"
).innerText =
completed;

document.getElementById(
"overdueMilestones"
).innerText =
overdue;

document.getElementById(
"goalProgress"
).innerText =
goalProgress + "%";

document.getElementById(
"progressText"
).innerText =
goalProgress + "%";

document.getElementById(
"progressFill"
).style.width =
goalProgress + "%";

}

/* =========================
   PROGRESS MODALS
========================= */

let selectedMilestoneId = null;

/* =========================
   UPDATE PROGRESS (+/-)
========================= */

function openUpdateProgress(id){

selectedMilestoneId = id;

const milestone =
milestones.find(
m => m.id === id
);

document.getElementById(
"currentProgressText"
).innerText =
`${milestone.current || 0} ${milestone.unit}`;

document.getElementById(
"progressInput"
).value = "";

progressModal.style.display =
"flex";

}

document.getElementById(
"cancelProgressBtn"
).onclick = ()=>{

progressModal.style.display =
"none";

};

document.getElementById(
"saveProgressBtn"
).onclick =
async()=>{

try{

const change =
Number(
document.getElementById(
"progressInput"
).value
);

const milestone =
milestones.find(
m => m.id === selectedMilestoneId
);

if(!milestone) return;

let newCurrent =
(milestone.current || 0)
+ change;

/* Prevent negative progress */

if(newCurrent < 0){

newCurrent = 0;

}

const progress =
Math.min(
100,
Math.round(
(newCurrent /
milestone.target)
* 100
)
);

/* Update milestone */

await updateDoc(

doc(
db,
"goals",
goalId,
"milestones",
selectedMilestoneId
),

{
current:newCurrent,
progress
}

);

/* History */

await addDoc(

collection(
db,
"goals",
goalId,
"milestones",
selectedMilestoneId,
"history"
),

{
type:"update",
change,
oldValue:
milestone.current || 0,
newValue:
newCurrent,
date:
Date.now()
}

);

progressModal.style.display =
"none";

await loadMilestones();

}catch(error){

console.error(error);

}

};

/* =========================
   EDIT PROGRESS
========================= */

function openEditProgress(id){

selectedMilestoneId = id;

const milestone =
milestones.find(
m => m.id === id
);

document.getElementById(
"editProgressInput"
).value =
milestone.current || 0;

editProgressModal.style.display =
"flex";

}

document.getElementById(
"cancelEditProgressBtn"
).onclick = ()=>{

editProgressModal.style.display =
"none";

};

document.getElementById(
"saveEditProgressBtn"
).onclick =
async()=>{

try{

const milestone =
milestones.find(
m => m.id === selectedMilestoneId
);

if(!milestone) return;

let newCurrent =
Number(
document.getElementById(
"editProgressInput"
).value
);

if(newCurrent < 0){

newCurrent = 0;

}

const progress =
Math.min(
100,
Math.round(
(newCurrent /
milestone.target)
*100
)
);

await updateDoc(

doc(
db,
"goals",
goalId,
"milestones",
selectedMilestoneId
),

{
current:newCurrent,
progress
}

);

/* History */

await addDoc(

collection(
db,
"goals",
goalId,
"milestones",
selectedMilestoneId,
"history"
),

{
type:"edit",
oldValue:
milestone.current || 0,
newValue:
newCurrent,
date:
Date.now()
}

);

editProgressModal.style.display =
"none";

await loadMilestones();

}catch(error){

console.error(error);

}

};

/* =========================
   GOAL SYNC
========================= */

async function syncGoalProgress(){

if(!currentGoal)
return;

let goalProgress = 0;

if(milestones.length){

goalProgress =
Math.round(

milestones.reduce(
(sum,m)=>
sum + (m.progress || 0),
0
)
/ milestones.length

);

}

let status =
"active";

if(goalProgress >= 100){

status =
"completed";

}

await updateDoc(

doc(
db,
"goals",
goalId
),

{
progress:
goalProgress,
status
}

);

}

/* =========================
   OVERRIDE STATS
========================= */

const oldUpdateGoalStats =
updateGoalStats;

updateGoalStats =
async function(){

oldUpdateGoalStats();

await syncGoalProgress();

};

/* =========================
   CLOSE MODALS
========================= */

window.addEventListener(
"click",
(e)=>{

if(
e.target === milestoneModal
){

milestoneModal.style.display =
"none";

}

if(
e.target === progressModal
){

progressModal.style.display =
"none";

}

if(
e.target === editProgressModal
){

editProgressModal.style.display =
"none";

}

}
);

/* =========================
   END
========================= */


milestoneModal.style.display =
"none";

await loadMilestones();

}catch(error){

console.error(error);

alert(
"Error saving milestone"
);

}

};

