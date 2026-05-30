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