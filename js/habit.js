/* ================= IMPORTS ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
doc,
addDoc,
updateDoc,
deleteDoc,
onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let habits = [];

let currentUser = null;

let totalXP = 0;

/* ================= AUTH ================= */

onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="index.html";
return;

}

currentUser=user;

loadHabits();

});

/* ================= TODAY ================= */

function getToday(){

return new Date()
.toISOString()
.split("T")[0];

}

/* ================= LOAD ================= */

function loadHabits(){

onSnapshot(
collection(db,"habits"),

(snapshot)=>{

habits=[];

snapshot.forEach(docu=>{

const h = docu.data();

if(h.uid===currentUser.uid){

habits.push({

id:docu.id,
...h

});

}

});

renderHabits();

updateDashboard();

}

);

}

/* ================= RENDER ================= */

function renderHabits(){

const container =
document.getElementById(
"habitContainer"
);

if(!container) return;

let html="";

habits.forEach(h=>{

const today =
getToday();

const doneToday =
h.completedDates?.includes(today);

html+=`

<div class="habit-card">

<div class="habit-left">

<div class="habit-name">

${h.name}

</div>

<div class="habit-meta">

📂 ${h.category}
•
🔥 ${h.streak || 0} Day Streak

</div>

</div>

<button
class="complete-btn"
onclick="completeHabit('${h.id}')"

${doneToday ? "disabled" : ""}

>

${doneToday ? "✅ Done" : "✔ Complete"}

</button>

</div>

`;

});

container.innerHTML=
html || "<p>No habits yet</p>";

}

/* ================= COMPLETE ================= */

window.completeHabit =
async(id)=>{

const habit =
habits.find(h=>h.id===id);

if(!habit) return;

const today =
getToday();

let completedDates =
habit.completedDates || [];

if(
completedDates.includes(today)
){
return;
}

completedDates.push(today);

/* STREAK */

let streak =
habit.streak || 0;

streak++;

let longest =
habit.longestStreak || 0;

if(streak > longest){

longest = streak;

}

/* UPDATE */

await updateDoc(

doc(db,"habits",id),

{

completedDates,

streak,

longestStreak:longest

}

);

};

/* ================= XP ================= */

function calculateXP(){

let xp=0;

habits.forEach(h=>{

xp +=
(h.completedDates?.length || 0)
*10;

});

return xp;

}

/* ================= LEVEL ================= */

function updateLevel(){

const xp =
calculateXP();

totalXP = xp;

const level =
Math.floor(xp/100)+1;

const current =
xp % 100;

const percent =
current;

document
.getElementById("xpText")
.innerText =

`${current}/100 XP`;

document
.getElementById("levelText")
.innerText =

`Level ${level}`;

document
.getElementById("xpFill")
.style.width =

percent + "%";

}

/* ================= DASHBOARD ================= */

function updateDashboard(){

updateLevel();

updateStats();

generateHeatmap();

generateInsights();

checkAchievements();

}

/* ================= STATS ================= */

function updateStats(){

let totalHabits = habits.length;

let completedToday = 0;

let currentStreak = 0;

let longestStreak = 0;

const today = getToday();

habits.forEach(h=>{

if(
h.completedDates?.includes(today)
){

completedToday++;

}

currentStreak +=
(h.streak || 0);

if(
(h.longestStreak || 0)
>
longestStreak
){

longestStreak =
h.longestStreak;

}

});

/* success rate */

let successRate = 0;

if(totalHabits > 0){

successRate = Math.round(
(completedToday/totalHabits)*100
);

}

/* update ui */

const streakEl =
document.getElementById(
"currentStreak"
);

if(streakEl){

streakEl.innerText =
currentStreak;

}

const longestEl =
document.getElementById(
"longestStreak"
);

if(longestEl){

longestEl.innerText =
longestStreak;

}

const successEl =
document.getElementById(
"successRate"
);

if(successEl){

successEl.innerText =
successRate + "%";

}

const scoreEl =
document.getElementById(
"todayScore"
);

if(scoreEl){

scoreEl.innerText =
successRate + "%";

}

}

/* ================= HEATMAP ================= */

function generateHeatmap(){

const grid =
document.querySelector(
".heat-grid"
);

if(!grid) return;

grid.innerHTML="";

let completedMap = {};

habits.forEach(h=>{

(h.completedDates || [])
.forEach(date=>{

completedMap[date] =
(completedMap[date] || 0)+1;

});

});

/* last 42 days */

for(let i=41;i>=0;i--){

let d = new Date();

d.setDate(
d.getDate()-i
);

let key =
d.toISOString()
.split("T")[0];

let count =
completedMap[key] || 0;

let level = 0;

if(count>=1) level=1;
if(count>=3) level=2;
if(count>=5) level=3;
if(count>=8) level=4;

grid.innerHTML +=

`
<div
class="heat-cell level${level}"
title="${key}">
</div>
`;

}

}

/* ================= ACHIEVEMENTS ================= */

function checkAchievements(){

const achievements =
document.querySelectorAll(
".achievement"
);

if(!achievements.length)
return;

let totalCompleted = 0;

let longest = 0;

habits.forEach(h=>{

totalCompleted +=
(h.completedDates?.length || 0);

if(
(h.longestStreak||0)
>
longest
){

longest =
h.longestStreak;

}

});

/* unlock style */

if(longest>=7){

achievements[0]
.style.border =
"2px solid #00ff95";

}

if(longest>=30){

achievements[1]
.style.border =
"2px solid gold";

}

if(totalCompleted>=100){

achievements[2]
.style.border =
"2px solid cyan";

}

if(totalCompleted>=365){

achievements[3]
.style.border =
"2px solid orange";

}

}

/* ================= AI INSIGHTS ================= */