import { auth, db } from "./firebase.js";

import {
collection,
doc,
addDoc,
getDocs,
getDoc,
updateDoc,
deleteDoc,
query,
where
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ==================================
   ELEMENTS
================================== */

const habitsGrid =
document.getElementById("habitsGrid");

const createHabitBtn =
document.getElementById("createHabitBtn");

const habitModal =
document.getElementById("habitModal");

const saveHabitBtn =
document.getElementById("saveHabitBtn");

const cancelHabitBtn =
document.getElementById("cancelHabitBtn");

const habitType =
document.getElementById("habitType");

const templateSelect =
document.getElementById("templateSelect");

const measurableFields =
document.getElementById("measurableFields");

const searchInput =
document.getElementById("searchInput");

/* ==================================
   STATE
================================== */

let currentUser = null;

let habits = [];

let habitLogs = [];

let editingHabitId = null;

/* ==================================
   TEMPLATES
================================== */

const templates = {

reading:{
name:"Read Book",
question:"How many pages did you read today?",
unit:"Pages",
target:10,
type:"measurable"
},

running:{
name:"Running",
question:"How many KM did you run today?",
unit:"KM",
target:5,
type:"measurable"
},

exercise:{
name:"Exercise",
question:"Did you exercise today?",
type:"yesno"
},

water:{
name:"Drink Water",
question:"How many glasses today?",
unit:"Glasses",
target:8,
type:"measurable"
},

english:{
name:"English Speaking",
question:"Did you speak English today?",
type:"yesno"
},

study:{
name:"Study",
question:"How many hours studied?",
unit:"Hours",
target:2,
type:"measurable"
}

};

/* ==================================
   LAST 30 DAYS
================================== */

function getLast30Days(){

const days = [];

for(let i=29;i>=0;i--){

const d = new Date();

d.setDate(
d.getDate() - i
);

days.push({

date:d.toISOString()
.split("T")[0],

day:d.getDate(),

month:d.toLocaleString(
"default",
{
month:"short"
}
)

});

}

return days;

}

const timelineDays =
getLast30Days();

/* ==================================
   AUTH
================================== */

onAuthStateChanged(
auth,
async(user)=>{

if(!user){

location.href =
"index.html";

return;

}

currentUser = user;

await loadHabits();

await loadHabitLogs();

renderGrid();

updateDashboard();

}
);

/* ==================================
   MODAL OPEN
================================== */

createHabitBtn.onclick =
()=>{

editingHabitId = null;

habitModal.style.display =
"flex";

document.getElementById(
"habitForm"
).reset();

};

/* ==================================
   MODAL CLOSE
================================== */

cancelHabitBtn.onclick =
()=>{

habitModal.style.display =
"none";

};

/* ==================================
   HABIT TYPE CHANGE
================================== */

habitType.addEventListener(
"change",
()=>{

if(
habitType.value ===
"measurable"
){

measurableFields
.style.display =
"block";

}else{

measurableFields
.style.display =
"none";

}

}
);

/* ==================================
   TEMPLATE CHANGE
================================== */

templateSelect.addEventListener(
"change",
()=>{

const template =
templates[
templateSelect.value
];

if(!template) return;

document.getElementById(
"habitName"
).value =
template.name;

document.getElementById(
"habitQuestion"
).value =
template.question;

if(
template.type ===
"measurable"
){

habitType.value =
"measurable";

measurableFields
.style.display =
"block";

document.getElementById(
"habitUnit"
).value =
template.unit;

document.getElementById(
"habitTarget"
).value =
template.target;

}else{

habitType.value =
"yesno";

measurableFields
.style.display =
"none";

}

});

/* ==================================
   SAVE HABIT
================================== */

saveHabitBtn.onclick =
async()=>{

const type =
document.getElementById(
"habitType"
).value;

const name =
document.getElementById(
"habitName"
).value.trim();

const question =
document.getElementById(
"habitQuestion"
).value.trim();

const color =
document.getElementById(
"habitColor"
).value;

const notes =
document.getElementById(
"habitNotes"
).value.trim();

if(!name){

alert(
"Habit name required"
);

return;

}

try{

const habitData = {

uid:
currentUser.uid,

type,

name,

question,

color,

notes,

createdAt:
Date.now()

};

if(type==="measurable"){

habitData.unit =
document.getElementById(
"habitUnit"
).value.trim();

habitData.target =
Number(
document.getElementById(
"habitTarget"
).value
);

habitData.targetType =
document.getElementById(
"targetType"
).value;

}

if(editingHabitId){

await updateDoc(

doc(
db,
"habits",
editingHabitId
),

habitData

);

}else{

await addDoc(

collection(
db,
"habits"
),

habitData

);

}

habitModal.style.display =
"none";

await loadHabits();

renderGrid();

updateDashboard();

}catch(error){

console.error(error);

alert(
"Error saving habit"
);

}

};

/* ==================================
   LOAD HABITS
================================== */

async function loadHabits(){

try{

const q = query(

collection(
db,
"habits"
),

where(
"uid",
"==",
currentUser.uid
)

);

const snapshot =
await getDocs(q);

habits = [];

snapshot.forEach(docSnap=>{

habits.push({

id:docSnap.id,

...docSnap.data()

});

});

}catch(error){

console.error(error);

}

}

/* ==================================
   LOAD LOGS
================================== */

async function loadHabitLogs(){

try{

const q = query(

collection(
db,
"habitLogs"
),

where(
"uid",
"==",
currentUser.uid
)

);

const snapshot =
await getDocs(q);

habitLogs = [];

snapshot.forEach(docSnap=>{

habitLogs.push({

id:docSnap.id,

...docSnap.data()

});

});

}catch(error){

console.error(error);

}

}

/* ==================================
   EDIT HABIT
================================== */

window.editHabit =
async(id)=>{

const habit =
habits.find(
h=>h.id===id
);

if(!habit) return;

editingHabitId =
habit.id;

habitModal.style.display =
"flex";

document.getElementById(
"habitType"
).value =
habit.type;

document.getElementById(
"habitName"
).value =
habit.name || "";

document.getElementById(
"habitQuestion"
).value =
habit.question || "";

document.getElementById(
"habitColor"
).value =
habit.color || "blue";

document.getElementById(
"habitNotes"
).value =
habit.notes || "";

if(
habit.type ===
"measurable"
){

measurableFields
.style.display =
"block";

document.getElementById(
"habitUnit"
).value =
habit.unit || "";

document.getElementById(
"habitTarget"
).value =
habit.target || "";

document.getElementById(
"targetType"
).value =
habit.targetType ||
"atleast";

}else{

measurableFields
.style.display =
"none";

}

};

/* ==================================
   DELETE HABIT
================================== */

window.deleteHabit =
async(id)=>{

const habit =
habits.find(
h=>h.id===id
);

if(!habit) return;

const confirmDelete =
confirm(

`Delete "${habit.name}" ?`

);

if(!confirmDelete)
return;

try{

await deleteDoc(

doc(
db,
"habits",
id
)

);

await loadHabits();

renderGrid();

updateDashboard();

}catch(error){

console.error(error);

}

};

/* ==================================
   SEARCH
================================== */

searchInput.addEventListener(
"input",
()=>{

renderGrid();

}
);

/* ==================================
   GET LOG
================================== */

function getLog(
habitId,
date
){

return habitLogs.find(

log =>

log.habitId === habitId

&&

log.date === date

);

}

/* ==================================
   RENDER GRID
================================== */

function renderGrid(){

if(!habitsGrid) return;

const search =
searchInput.value
.toLowerCase();

habitsGrid.innerHTML =
"";

/* ==========================
   HEADER
========================== */

let header = `

<div class="habit-row header-row">

<div class="habit-info header-cell">

Habit

</div>

`;

let lastMonth = "";

timelineDays.forEach(day=>{

const monthText =

day.month !== lastMonth

? day.month

: "";

lastMonth =
day.month;

header += `

<div class="day-wrapper">

<div class="month-name">

${monthText}

</div>

<div class="date-header-cell">

${day.day}

</div>

</div>

`;

});

header += `

</div>

`;

habitsGrid.innerHTML +=
header;

/* ==========================
   FILTER
========================== */

const filteredHabits =

habits.filter(h=>{

return h.name
.toLowerCase()
.includes(search);

});

/* ==========================
   HABITS
========================== */

filteredHabits.forEach(habit=>{

let row = `

<div class="habit-row">

<div
class="habit-info"
style="
border-left:
6px solid
${habit.color};
">

<div class="habit-title">

${habit.name}

</div>

<div class="habit-sub">

${habit.type==="measurable"

? `🎯 ${habit.target} ${habit.unit}`

: "✅ Yes / No Habit"}

</div>

<div class="habit-actions">

<button
onclick="editHabit('${habit.id}')">

✏

</button>

<button
onclick="deleteHabit('${habit.id}')">

🗑

</button>

</div>

</div>

`;

timelineDays.forEach(day=>{

const log =
getLog(
habit.id,
day.date
);

let cellText = "";

let cellClass =
"empty-cell";

/* ===================
   YES NO
=================== */

if(
habit.type ===
"yesno"
){

if(log){

if(
log.status ===
"done"
){

cellText = "✓";

cellClass =
"done-cell";

}

else if(
log.status ===
"missed"
){

cellText = "✗";

cellClass =
"missed-cell";

}

else{

cellText = "⏭";

cellClass =
"skip-cell";

}

}

}

/* ===================
   MEASURABLE
=================== */

else{

if(log){

cellText =
log.value || "";

const percent =

habit.target

?

(log.value /
habit.target) * 100

: 0;

if(percent >= 100){

cellClass =
"success-cell";

}

else if(
percent >= 50
){

cellClass =
"warning-cell";

}

else{

cellClass =
"danger-cell";

}

}

}

row += `

<div
class="
habit-day
${cellClass}
"
onclick="
openUpdateModal(
'${habit.id}',
'${day.date}'
)
">

${cellText}

</div>

`;

});

row += `

</div>

`;

habitsGrid.innerHTML +=
row;

});

}

/* ==================================
   UPDATE MODAL ELEMENTS
================================== */

const updateModal =
document.getElementById(
"updateModal"
);

const updateTitle =
document.getElementById(
"updateTitle"
);

const yesNoSection =
document.getElementById(
"yesNoSection"
);

const measureSection =
document.getElementById(
"measureSection"
);

const todayValue =
document.getElementById(
"todayValue"
);

const todayProgress =
document.getElementById(
"todayProgress"
);

let selectedHabitId =
null;

let selectedDate =
null;

/* ==================================
   OPEN UPDATE MODAL
================================== */

window.openUpdateModal =
async(
habitId,
date
)=>{

selectedHabitId =
habitId;

selectedDate =
date;

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit) return;

updateTitle.innerText =
habit.name;

updateModal.style.display =
"flex";

/* YES / NO */

if(
habit.type ===
"yesno"
){

yesNoSection
.style.display =
"block";

measureSection
.style.display =
"none";

}

/* MEASURABLE */

else{

yesNoSection
.style.display =
"none";

measureSection
.style.display =
"block";

const existingLog =
getLog(
habit.id,
date
);

todayValue.value =

existingLog
? existingLog.value
: "";

todayProgress.innerHTML =

`🎯 Target:
${habit.target}
${habit.unit}`;

}

};

/* ==================================
   CLOSE UPDATE MODAL
================================== */

document
.getElementById(
"closeUpdateBtn"
)
.onclick =
()=>{

updateModal.style.display =
"none";

};

/* ==================================
   SAVE YES / NO
================================== */

async function saveYesNoLog(
status
){

try{

const existingLog =
getLog(
selectedHabitId,
selectedDate
);

if(existingLog){

await updateDoc(

doc(
db,
"habitLogs",
existingLog.id
),

{
status
}

);

}else{

await addDoc(

collection(
db,
"habitLogs"
),

{
uid:
currentUser.uid,

habitId:
selectedHabitId,

date:
selectedDate,

status
}

);

}

await loadHabitLogs();

renderGrid();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

}

/* ==================================
   DONE BUTTON
================================== */

document
.getElementById(
"doneBtn"
)
.onclick =
()=>{

saveYesNoLog(
"done"
);

};

/* ==================================
   MISSED BUTTON
================================== */

document
.getElementById(
"missedBtn"
)
.onclick =
()=>{

saveYesNoLog(
"missed"
);

};

/* ==================================
   SKIP BUTTON
================================== */

document
.getElementById(
"skipBtn"
)
.onclick =
()=>{

saveYesNoLog(
"skip"
);

};

/* ==================================
   SAVE MEASURABLE
================================== */

document
.getElementById(
"saveProgressBtn"
)
.onclick =
async()=>{

const value =
Number(
todayValue.value
);

if(
isNaN(value)
){

alert(
"Enter value"
);

return;

}

try{

const existingLog =
getLog(
selectedHabitId,
selectedDate
);

if(existingLog){

await updateDoc(

doc(
db,
"habitLogs",
existingLog.id
),

{
value
}

);

}else{

await addDoc(

collection(
db,
"habitLogs"
),

{
uid:
currentUser.uid,

habitId:
selectedHabitId,

date:
selectedDate,

value
}

);

}

await loadHabitLogs();

renderGrid();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

};

/* ==================================
   STREAK CALCULATION
================================== */

function calculateHabitStreak(
habitId
){

const logs =

habitLogs
.filter(
log=>
log.habitId === habitId
)
.sort(
(a,b)=>
new Date(b.date)
-
new Date(a.date)
);

let streak = 0;

for(const log of logs){

let success = false;

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit) continue;

/* YES NO */

if(
habit.type ===
"yesno"
){

success =
log.status ===
"done";

}

/* MEASURABLE */

else{

success =
Number(log.value) >=
Number(habit.target);

}

if(success){

streak++;

}else{

break;

}

}

return streak;

}

/* ==================================
   BEST STREAK
================================== */

function calculateBestStreak(){

let best = 0;

habits.forEach(habit=>{

const streak =
calculateHabitStreak(
habit.id
);

if(streak > best){

best = streak;

}

});

return best;

}

/* ==================================
   DASHBOARD
================================== */

function updateDashboard(){

/* TOTAL HABITS */

document.getElementById(
"totalHabits"
).innerText =
habits.length;

/* TODAY */

const today =
new Date()
.toISOString()
.split("T")[0];

let todayDone = 0;

let completed = 0;

let total = 0;

let currentBest = 0;

habits.forEach(habit=>{

const streak =
calculateHabitStreak(
habit.id
);

if(streak > currentBest){

currentBest =
streak;

}

});

/* LOGS */

habitLogs.forEach(log=>{

const habit =
habits.find(
h=>
h.id ===
log.habitId
);

if(!habit) return;

total++;

let success =
false;

/* YES NO */

if(
habit.type ===
"yesno"
){

success =
log.status ===
"done";

}

/* MEASURABLE */

else{

success =
Number(log.value)
>=
Number(habit.target);

}

if(success){

completed++;

}

/* TODAY */

if(
log.date === today
&&
success
){

todayDone++;

}

});

/* COMPLETION */

const completionRate =

total > 0

?

Math.round(

(completed/total)
*100

)

: 0;

/* UPDATE UI */

document.getElementById(
"todayDone"
).innerText =
todayDone;

document.getElementById(
"completionRate"
).innerText =
completionRate + "%";

document.getElementById(
"currentStreak"
).innerText =
currentBest;

document.getElementById(
"bestStreak"
).innerText =
calculateBestStreak();

}

/* ==================================
   CLOSE MODALS
================================== */

window.addEventListener(
"click",
(e)=>{

if(
e.target ===
habitModal
){

habitModal.style.display =
"none";

}

if(
e.target ===
updateModal
){

updateModal.style.display =
"none";

}

const deleteModal =
document.getElementById(
"deleteModal"
);

if(
deleteModal &&
e.target ===
deleteModal
){

deleteModal.style.display =
"none";

}

}
);

/* ==================================
   ESC KEY CLOSE
================================== */

document.addEventListener(
"keydown",
(e)=>{

if(
e.key ===
"Escape"
){

habitModal.style.display =
"none";

updateModal.style.display =
"none";

const deleteModal =
document.getElementById(
"deleteModal"
);

if(deleteModal){

deleteModal.style.display =
"none";

}

}

}
);

/* ==================================
   STARTUP
================================== */

async function initializeHabits(){

if(!currentUser)
return;

await loadHabits();

await loadHabitLogs();

renderGrid();

updateDashboard();

}

/* ==================================
   REFRESH
================================== */

window.refreshHabits =
async()=>{

await loadHabits();

await loadHabitLogs();

renderGrid();

updateDashboard();

};

/* ==================================
   END
================================== */