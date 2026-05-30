import { db } from "./firebase.js";

import {

doc,
getDoc,

collection,
addDoc,

deleteDoc,

updateDoc,

onSnapshot

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params =
new URLSearchParams(
window.location.search
);

const goalId =
params.get("id");

let milestones=[];

let goal=null;

/* LOAD GOAL */

async function loadGoal(){

const snap =
await getDoc(
doc(db,"plannerGoals",goalId)
);

goal = snap.data();

document.getElementById(
"goalName"
).innerText =
goal.name;

document.getElementById(
"goalCategory"
).innerText =
goal.category;

document.getElementById(
"goalDescription"
).innerText =
goal.description || "";

document.getElementById(
"goalPriority"
).innerText =
goal.priority;

document.getElementById(
"goalTarget"
).innerText =
goal.targetDate;

}

/* LOAD MILESTONES */

function loadMilestones(){

onSnapshot(

collection(
db,
"plannerGoals",
goalId,
"milestones"
),

(snapshot)=>{

milestones=[];

snapshot.forEach(d=>{

milestones.push({

id:d.id,
...d.data()

});

});

renderMilestones();

updateStats();

}

);

}

/* ADD */

window.addMilestone =
async()=>{

const name =
document.getElementById(
"milestoneName"
).value;

const date =
document.getElementById(
"milestoneDate"
).value;

const progress =
Number(
document.getElementById(
"milestoneProgress"
).value
);

const status =
document.getElementById(
"milestoneStatus"
).value;

await addDoc(

collection(
db,
"plannerGoals",
goalId,
"milestones"
),

{

name,
date,
progress,
status

}

);

};

/* RENDER */

function renderMilestones(){

const container =
document.getElementById(
"milestoneContainer"
);

const timeline =
document.getElementById(
"timelineContainer"
);

let html="";
let timelineHtml="";

milestones.forEach(m=>{

html+=`

<div class="milestone-card">

<h3>${m.name}</h3>

<p>
📅 ${m.date}
</p>

<p>
${m.status}
</p>

<p>
${m.progress}%
</p>

<div class="progress-bar">

<div
class="progress-fill"
style="width:${m.progress}%">

</div>

</div>

<br>

<button
onclick="completeMilestone('${m.id}')">

✅ Complete

</button>

<button
onclick="deleteMilestone('${m.id}')">

🗑 Delete

</button>

</div>

`;

timelineHtml+=`

<div class="timeline-item">

📅 ${m.date}

<br>

${m.name}

</div>

`;

});

container.innerHTML=html;

timeline.innerHTML=
timelineHtml;

}

/* COMPLETE */

window.completeMilestone =
async(id)=>{

await updateDoc(

doc(
db,
"plannerGoals",
goalId,
"milestones",
id
),

{

progress:100,
status:"Completed"

}

);

};

/* DELETE */

window.deleteMilestone =
async(id)=>{

await deleteDoc(

doc(
db,
"plannerGoals",
goalId,
"milestones",
id
)

);

};

/* STATS */

async function updateStats(){

let total =
milestones.length;

let completed =
milestones.filter(

m=>m.progress>=100

).length;

let remaining =
total-completed;

document.getElementById(
"totalMilestones"
).innerText = total;

document.getElementById(
"completedMilestones"
).innerText = completed;

document.getElementById(
"remainingMilestones"
).innerText = remaining;

/* Goal Progress */

let progress=0;

milestones.forEach(m=>{

progress +=
(m.progress||0);

});

let avg =
total
?
Math.round(progress/total)
:
0;

document.getElementById(
"goalProgressText"
).innerText =
avg+"%";

document.getElementById(
"goalProgressFill"
).style.width =
avg+"%";

/* UPDATE GOAL */

await updateDoc(

doc(
db,
"plannerGoals",
goalId
),

{

progress:avg

}

);

/* HEALTH */

let health="🟢 On Track";

if(avg<30){

health="🔴 Delayed";

}
else if(avg<60){

health="🟡 At Risk";

}

document.getElementById(
"goalHealth"
).innerText =
health;

}

/* NOTES */

window.saveNotes =
async()=>{

const notes =
document.getElementById(
"goalNotes"
).value;

await updateDoc(

doc(
db,
"plannerGoals",
goalId
),

{

notes

}

);

alert("Saved");

};

loadGoal();

loadMilestones();