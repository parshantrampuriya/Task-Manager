import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
updateDoc,
addDoc,
deleteDoc,
collection,
getDocs,
query,
where
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

const progressModal =
document.getElementById(
"progressModal"
);

const editProgressModal =
document.getElementById(
"editProgressModal"
);

/* =========================
   STATE
========================= */

let currentUser = null;

let milestones = [];

let currentGoal = null;

let editMilestoneId = null;

let selectedProgressId = null;

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

const goalRef =
doc(
db,
"goals",
goalId
);

const snap =
await getDoc(
goalRef
);

if(!snap.exists()){

alert(
"Goal not found"
);

return;

}

currentGoal = {

id:snap.id,

...snap.data()

};

goalTitle.innerText =
currentGoal.name;

goalDescription.innerText =
currentGoal.description ||
"No description";

}

/* =========================
   CREATE MILESTONE
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

if(!target){

alert(
"Target required"
);

return;

}

try{

if(editMilestoneId){

await updateDoc(

doc(
db,
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
"milestones"
),

{
uid:
currentUser.uid,

goalId,

name,

target,

current:0,

unit,

progress:0,

startDate,

endDate,

createdAt:
Date.now()

}

);
/* =========================
   LOAD MILESTONES
========================= */

async function loadMilestones(){

const q = query(
collection(db,"milestones"),
where("goalId","==",goalId)
);

const snapshot =
await getDocs(q);

milestones = [];

snapshot.forEach(docSnap=>{

milestones.push({
id:docSnap.id,
...docSnap.data()
});

});

renderMilestones();

updateStats();

}

/* =========================
   RENDER
========================= */

function renderMilestones(){

const searchText =
searchInput.value.toLowerCase();

milestoneContainer.innerHTML = "";

const filtered =
milestones.filter(m =>
m.name.toLowerCase()
.includes(searchText)
);

if(filtered.length === 0){

milestoneContainer.innerHTML = `

<div class="milestone-card">

<h3>
No Milestones Found
</h3>

<p>
Create your first milestone
</p>

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
new Date(m.endDate) < new Date()
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
${m.target} ${m.unit}
</div>

<div class="milestone-info">
📈 Current:
${m.current || 0} ${m.unit}
</div>

<div class="milestone-info">
📅 ${m.startDate || "-"}
</div>

<div class="milestone-info">
🏁 ${m.endDate || "-"}
</div>

<div class="milestone-progress">

<div class="milestone-progress-bar">

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
class="update-btn">

➕ Update

</button>

<button
class="edit-progress-btn">

✏ Progress

</button>

<button
class="edit-btn">

⚙ Edit

</button>

<button
class="delete-btn">

🗑 Delete

</button>

</div>

`;

/* UPDATE */

card.querySelector(
".update-btn"
)
.addEventListener(
"click",
()=>openUpdateProgress(m)
);

/* EDIT PROGRESS */

card.querySelector(
".edit-progress-btn"
)
.addEventListener(
"click",
()=>openEditProgress(m)
);

/* EDIT */

card.querySelector(
".edit-btn"
)
.addEventListener(
"click",
()=>editMilestone(m)
);

/* DELETE */

card.querySelector(
".delete-btn"
)
.addEventListener(
"click",
()=>deleteMilestone(m.id)
);

milestoneContainer
.appendChild(card);

});

}

/* =========================
   EDIT MILESTONE
========================= */

function editMilestone(m){

editMilestoneId = m.id;

document.getElementById(
"modalTitle"
).innerText =
"✏ Edit Milestone";

document.getElementById(
"milestoneName"
).value = m.name;

document.getElementById(
"targetValue"
).value = m.target;

document.getElementById(
"unitType"
).value = m.unit;

document.getElementById(
"startDate"
).value = m.startDate;

document.getElementById(
"endDate"
).value = m.endDate;

milestoneModal.style.display =
"flex";

}

/* =========================
   DELETE
========================= */

async function deleteMilestone(id){

const ok =
confirm(
"Delete milestone?"
);

if(!ok) return;

await deleteDoc(
doc(
db,
"milestones",
id
)
);

await loadMilestones();

}

/* =========================
   UPDATE PROGRESS
========================= */

function openUpdateProgress(m){

selectedProgressId = m.id;

document.getElementById(
"currentProgressText"
).innerText =
m.current || 0;

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

const value =
Number(
document.getElementById(
"progressInput"
).value
);

const milestone =
milestones.find(
m => m.id === selectedProgressId
);

const newCurrent =
(milestone.current || 0)
+ value;

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
"milestones",
milestone.id
),

{
current:newCurrent,
progress
}

);

progressModal.style.display =
"none";

await loadMilestones();

};
}

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
   EDIT PROGRESS
========================= */

function openEditProgress(m){

selectedProgressId = m.id;

document.getElementById(
"editProgressInput"
).value =
m.current || 0;

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

const newCurrent =
Number(
document.getElementById(
"editProgressInput"
).value
);

const milestone =
milestones.find(
m => m.id === selectedProgressId
);

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
"milestones",
milestone.id
),

{
current:newCurrent,
progress
}

);

editProgressModal.style.display =
"none";

await loadMilestones();

};

/* =========================
   STATS
========================= */

async function updateStats(){

const active =
milestones.filter(m =>
(m.progress || 0) < 100
).length;

const completed =
milestones.filter(m =>
(m.progress || 0) >= 100
).length;

const overdue =
milestones.filter(m => {

if(!m.endDate)
return false;

return (
new Date(m.endDate)
< new Date()
&&
(m.progress || 0) < 100
);

}).length;

/* GOAL PROGRESS */

let goalProgress = 0;

if(milestones.length){

goalProgress = Math.round(

milestones.reduce(
(sum,m)=>
sum + (m.progress || 0),
0
)
/
milestones.length

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

/* =========================
   UPDATE GOAL IN FIRESTORE
========================= */

if(currentGoal){

let goalStatus =
"active";

if(goalProgress >= 100){

goalStatus =
"completed";

}

await updateDoc(

doc(
db,
"goals",
goalId
),

{
progress:goalProgress,
status:goalStatus
}

);

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
   CLOSE MODAL ON OUTSIDE CLICK
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
   OPTIONAL:
   PROGRESS HISTORY READY
========================= */

/*

Future Collection:

milestoneHistory

{
 milestoneId:"",
 change:+10,
 date:Date.now()
}

You can add this later
without changing
current structure.

*/

/* =========================
   END
========================= */
