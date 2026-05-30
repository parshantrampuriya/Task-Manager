/* ================= IMPORTS ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let currentUser = null;

let goals = [];

let visions = [];

let reviews = [];

/* ================= AUTH ================= */

onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="index.html";
return;

}

currentUser = user;

loadGoals();

});

/* ================= LOAD GOALS ================= */

function loadGoals(){

onSnapshot(

collection(db,"plannerGoals"),

(snapshot)=>{

goals=[];

snapshot.forEach(doc=>{

const g = doc.data();

if(g.uid===currentUser.uid){

goals.push({

id:doc.id,
...g

});

}

});

renderGoals();

updateDashboard();

generateRoadmap();

generateGantt();

generateHealth();

generateInsights();

}

);

}

/* ================= CREATE GOAL ================= */

window.createGoal = async()=>{

const name =
document.getElementById("goalName").value;

const category =
document.getElementById("goalCategory").value;

const priority =
document.getElementById("goalPriority").value;

const startDate =
document.getElementById("goalStartDate").value;

const targetDate =
document.getElementById("goalTargetDate").value;

const description =
document.getElementById("goalDescription").value;

if(!name){

alert("Enter Goal Name");
return;

}

await addDoc(

collection(db,"plannerGoals"),

{

uid:currentUser.uid,

name,
category,
priority,

startDate,
targetDate,

description,

progress:0,

status:"On Track",

createdAt:Date.now()

}

);

/* clear */

document.getElementById("goalName").value="";
document.getElementById("goalDescription").value="";

};

/* ================= GOALS ================= */

function renderGoals(){

const container =
document.getElementById("goalContainer");

if(!container) return;

let html="";

goals.forEach(g=>{

html+=`

<div class="goal-card">

<h3>
${g.name}
</h3>

<p>
📂 ${g.category}
</p>

<p>
🎯 ${g.priority}
</p>

<p>
📅 ${g.targetDate}
</p>

<div class="goal-progress">

<div
class="goal-progress-fill"
style="width:${g.progress || 0}%">

</div>

</div>

<p>
${g.progress || 0}% Complete
</p>

</div>

`;

});

container.innerHTML =
html || "<p>No Goals Yet</p>";

}

/* ================= DASHBOARD ================= */

function updateDashboard(){

let active =
goals.length;

let completed =
goals.filter(
g=>g.progress>=100
).length;

let progress=0;

goals.forEach(g=>{

progress +=
(g.progress || 0);

});

let avg = active
? Math.round(progress/active)
: 0;

/* life score */

let lifeScore =
Math.min(
100,
Math.round(avg*1.1)
);

document.getElementById(
"lifeScore"
).innerText = lifeScore;

document.getElementById(
"activeGoals"
).innerText = active;

document.getElementById(
"completedGoals"
).innerText = completed;

document.getElementById(
"overallProgress"
).innerText = avg+"%";

/* XP */

let xp =
completed*100 +
active*20;

let level =
Math.floor(xp/100)+1;

let current =
xp%100;

document.getElementById(
"levelText"
).innerText =
`Level ${level}`;

document.getElementById(
"xpText"
).innerText =
`${current}/100 XP`;

document.getElementById(
"xpFill"
).style.width =
current+"%";

}

/* ================= ROADMAP ================= */

function generateRoadmap(){

const container =
document.getElementById(
"roadmapContainer"
);

if(!container) return;

let html="";

goals.forEach(g=>{

html+=`

<div class="road-item">

<h4>
${g.name}
</h4>

<p>
📅 ${g.targetDate}
</p>

<p>
${g.category}
</p>

</div>

`;

});

container.innerHTML = html;

}

/* ================= GANTT ================= */

function generateGantt(){

const container =
document.getElementById(
"ganttContainer"
);

if(!container) return;

let html="";

goals.forEach(g=>{

let width =
Math.max(
(g.progress || 10),
10
);

html+=`

<div class="gantt-row">

<div class="gantt-name">

${g.name}

</div>

<div
class="gantt-bar"
style="width:${width}%">

</div>

</div>

`;

});

container.innerHTML = html;

}

/* ================= HEALTH ================= */

function generateHealth(){

const container =
document.getElementById(
"healthContainer"
);

if(!container) return;

let html="";

goals.forEach(g=>{

let cls =
"health-good";

let status =
"🟢 On Track";

if(g.progress < 30){

cls="health-danger";

status="🔴 Delayed";

}else if(
g.progress < 60
){

cls="health-warning";

status="🟡 At Risk";

}

html+=`

<div class="health-card ${cls}">

<h4>
${g.name}
</h4>

<p>
${status}
</p>

<p>
${g.progress || 0}% Complete
</p>

</div>

`;

});

container.innerHTML = html;

}

/* ================= VISION BOARD ================= */

window.addVision = ()=>{

const title =
document.getElementById(
"visionTitle"
).value;

const image =
document.getElementById(
"visionImage"
).value;

if(!title || !image){

alert("Enter title & image");
return;

}

visions.push({
title,
image
});

renderVision();

};

function renderVision(){

const board =
document.getElementById(
"visionBoard"
);

if(!board) return;

let html="";

visions.forEach(v=>{

html+=`

<div class="vision-card">

<img src="${v.image}">

<h4>
${v.title}
</h4>

</div>

`;

});

board.innerHTML = html;

}

/* ================= REVIEWS ================= */

window.saveReview = ()=>{

const month =
document.getElementById(
"reviewMonth"
).value;

const achievement =
document.getElementById(
"reviewAchievement"
).value;

const lesson =
document.getElementById(
"reviewLesson"
).value;

const focus =
document.getElementById(
"reviewFocus"
).value;

reviews.push({

month,
achievement,
lesson,
focus

});

renderReviews();

};

function renderReviews(){

const container =
document.getElementById(
"reviewContainer"
);

if(!container) return;

let html="";

reviews.forEach(r=>{

html+=`

<div class="goal-card">

<h3>
${r.month}
</h3>

<p>
✅ ${r.achievement}
</p>

<p>
📚 ${r.lesson}
</p>

<p>
🎯 ${r.focus}
</p>

</div>

`;

});

container.innerHTML = html;

}

/* ================= AI INSIGHTS ================= */

function generateInsights(){

const box =
document.getElementById(
"insightsBox"
);

if(!box) return;

if(goals.length===0){

box.innerHTML =
"Create goals to receive insights.";

return;

}

let highPriority =
goals.filter(
g=>g.priority==="High"
).length;

box.innerHTML = `

🎯 Active Goals:
${goals.length}

🔥 High Priority Goals:
${highPriority}

📈 Average Progress:
${document.getElementById("overallProgress").innerText}

💡 Recommendation:
Focus on goals below 50% completion.

`;

}