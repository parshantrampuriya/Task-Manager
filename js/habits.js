import { auth, db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
updateDoc,
deleteDoc,
doc,
query,
where
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   ELEMENTS
========================= */

const habitTable =
document.getElementById("habitTable");

const searchInput =
document.getElementById("searchInput");

const createHabitBtn =
document.getElementById("createHabitBtn");

const weekTitle =
document.getElementById("weekTitle");

const prevWeekBtn =
document.getElementById("prevWeekBtn");

const nextWeekBtn =
document.getElementById("nextWeekBtn");

/* =========================
   MODALS
========================= */

const habitTypeModal =
document.getElementById("habitTypeModal");

const yesNoModal =
document.getElementById("yesNoModal");

const measurableModal =
document.getElementById("measurableModal");

const updateModal =
document.getElementById("updateModal");

const habitMenuModal =
document.getElementById("habitMenuModal");

const statsModal =
document.getElementById("statsModal");

const deleteModal =
document.getElementById("deleteModal");

/* =========================
   STATE
========================= */

let currentUser = null;

let habits = [];

let habitLogs = [];

let selectedHabit = null;

let selectedDate = null;

let currentWeekOffset = 0;

/* =========================
   AUTH
========================= */

onAuthStateChanged(
auth,
async (user) => {

if (!user) {

window.location.href =
"index.html";

return;

}

currentUser = user;

await loadHabits();

await loadLogs();

renderTable();

updateDashboard();

}
);

/* =========================
   WEEK FUNCTIONS
========================= */

function getWeekDates(
offset = 0
){

const today =
new Date();

const currentDay =
today.getDay();

const monday =
new Date(today);

monday.setDate(
today.getDate()
-
(currentDay === 0
? 6
: currentDay - 1)
+
(offset * 7)
);

const dates = [];

for(let i = 0; i < 7; i++){

const date =
new Date(monday);

date.setDate(
monday.getDate() + i
);

dates.push({

date:
date
.toISOString()
.split("T")[0],

day:
date.toLocaleDateString(
"en-US",
{
weekday:"short"
}
),

number:
date.getDate()

});

}

return dates;

}

/* =========================
   WEEK TITLE
========================= */

function updateWeekTitle(){

const week =
getWeekDates(currentWeekOffset);

const first =
new Date(week[0].date);

const last =
new Date(week[6].date);

const month =
first.toLocaleDateString(
"en-US",
{
month:"long"
}
);

const year =
first.getFullYear();

weekTitle.innerText =
`${month} ${year} | ${week[0].number} - ${week[6].number}`;

}

/* =========================
   WEEK NAVIGATION
========================= */

prevWeekBtn.addEventListener(
"click",
()=>{

currentWeekOffset--;

updateWeekTitle();

renderTable();

}
);

nextWeekBtn.addEventListener(
"click",
()=>{

currentWeekOffset++;

updateWeekTitle();

renderTable();

}
);

/* =========================
   CREATE BUTTON
========================= */

createHabitBtn.addEventListener(
"click",
()=>{

habitTypeModal.style.display =
"flex";

}
);

/* =========================
   INITIAL
========================= */

updateWeekTitle();
  /* =========================
   LOAD HABITS
========================= */

async function loadHabits(){

try{

const q = query(
collection(db,"habits"),
where(
"uid",
"==",
currentUser.uid
)
);

const snapshot =
await getDocs(q);

habits = [];

snapshot.forEach((docSnap)=>{

habits.push({

id:docSnap.id,

...docSnap.data()

});

});

}catch(error){

console.error(
"Load Habits Error:",
error
);

}

}

/* =========================
   LOAD LOGS
========================= */

async function loadLogs(){

try{

const q = query(
collection(db,"habitLogs"),
where(
"uid",
"==",
currentUser.uid
)
);

const snapshot =
await getDocs(q);

habitLogs = [];

snapshot.forEach((docSnap)=>{

habitLogs.push({

id:docSnap.id,

...docSnap.data()

});

});

}catch(error){

console.error(
"Load Logs Error:",
error
);

}

}

/* =========================
   OPEN YES NO MODAL
========================= */

document
.getElementById(
"yesNoHabitBtn"
)
.addEventListener(
"click",
()=>{

habitTypeModal.style.display =
"none";

yesNoModal.style.display =
"flex";

}
);

/* =========================
   OPEN MEASURABLE MODAL
========================= */

document
.getElementById(
"measurableHabitBtn"
)
.addEventListener(
"click",
()=>{

habitTypeModal.style.display =
"none";

measurableModal.style.display =
"flex";

}
);

/* =========================
   CLOSE TYPE MODAL
========================= */

document
.getElementById(
"closeTypeModalBtn"
)
.addEventListener(
"click",
()=>{

habitTypeModal.style.display =
"none";

}
);

/* =========================
   CLOSE YES NO MODAL
========================= */

document
.getElementById(
"cancelYesNoBtn"
)
.addEventListener(
"click",
()=>{

yesNoModal.style.display =
"none";

}
);

/* =========================
   CLOSE MEASURABLE MODAL
========================= */

document
.getElementById(
"cancelMeasureBtn"
)
.addEventListener(
"click",
()=>{

measurableModal.style.display =
"none";

}
);

/* =========================
   SAVE YES NO HABIT
========================= */

document
.getElementById(
"saveYesNoHabitBtn"
)
.addEventListener(
"click",
async()=>{

const name =
document
.getElementById(
"yesNoName"
)
.value
.trim();

const question =
document
.getElementById(
"yesNoQuestion"
)
.value
.trim();

const color =
document
.getElementById(
"yesNoColor"
)
.value;

const notes =
document
.getElementById(
"yesNoNotes"
)
.value
.trim();

if(!name){

alert(
"Habit name required"
);

return;

}

try{

await addDoc(

collection(
db,
"habits"
),

{
uid:
currentUser.uid,

name,

question,

color,

notes,

type:
"yesno",

createdAt:
Date.now()

}

);

yesNoModal.style.display =
"none";

await loadHabits();

renderTable();

updateDashboard();

}catch(error){

console.error(error);

}

}
);

/* =========================
   SAVE MEASURABLE HABIT
========================= */

document
.getElementById(
"saveMeasureHabitBtn"
)
.addEventListener(
"click",
async()=>{

const name =
document
.getElementById(
"measureName"
)
.value
.trim();

const question =
document
.getElementById(
"measureQuestion"
)
.value
.trim();

const unit =
document
.getElementById(
"measureUnit"
)
.value
.trim();

const target =
Number(
document
.getElementById(
"measureTarget"
)
.value
);

const targetType =
document
.getElementById(
"measureTargetType"
)
.value;

const color =
document
.getElementById(
"measureColor"
)
.value;

const notes =
document
.getElementById(
"measureNotes"
)
.value
.trim();

if(!name){

alert(
"Habit name required"
);

return;

}

try{

await addDoc(

collection(
db,
"habits"
),

{
uid:
currentUser.uid,

type:
"measurable",

name,

question,

unit,

target,

targetType,

color,

notes,

createdAt:
Date.now()

}

);

measurableModal.style.display =
"none";

await loadHabits();

renderTable();

updateDashboard();

}catch(error){

console.error(error);

}

}
);
  /* =========================
   SEARCH
========================= */

searchInput.addEventListener(
"input",
()=>{

renderTable();

}
);

/* =========================
   GET LOG
========================= */

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

/* =========================
   RENDER TABLE
========================= */

function renderTable(){

if(!habitTable) return;

const weekDates =
getWeekDates(
currentWeekOffset
);

const search =
searchInput.value
.toLowerCase();

habitTable.innerHTML =
"";

/* =========================
   HEADER
========================= */

let html = `

<div class="habit-row header-row">

<div class="habit-info header-cell">

Habit

</div>

`;

weekDates.forEach(day=>{

html += `

<div class="day-wrapper">

<div class="month-name">

${new Date(day.date)
.toLocaleDateString(
"en-US",
{
month:"short"
}
)}

</div>

</div>

<div class="date-header-cell">

${day.number}

</div>

</div>

`;

});

html += `

</div>

`;

/* =========================
   FILTER
========================= */

const filteredHabits =

habits.filter(h=>{

return h.name
.toLowerCase()
.includes(search);

});

/* =========================
   EMPTY
========================= */

if(filteredHabits.length===0){

html += `

<div class="habit-row">

<div class="habit-info">

No Habits Found

</div>

</div>

`;

habitTable.innerHTML =
html;

return;

}

/* =========================
   HABITS
========================= */

filteredHabits.forEach(habit=>{

html += `

<div class="habit-row">

<div
class="habit-info"
style="
border-left:
5px solid
${habit.color};
">

<div class="habit-name">

${habit.name}

</div>

<div class="habit-small">

${habit.type==="yesno"

? "Yes / No Habit"

: `${habit.target}
${habit.unit}`}

</div>

<div class="habit-actions">

<button
onclick="openHabitMenu('${habit.id}')">

⚙

</button>

<button
onclick="deleteHabit('${habit.id}')">

🗑

</button>

</div>

</div>

`;

weekDates.forEach(day=>{

const log =
getLog(
habit.id,
day.date
);

let value = "";

let cellClass =
"empty-cell";

/* =====================
   YES NO
===================== */

if(
habit.type ===
"yesno"
){

if(log){

if(
log.status ===
"done"
){

value = "✓";

cellClass =
"done-cell";

}
else if(
log.status ===
"missed"
){

value = "✗";

cellClass =
"missed-cell";

}
else{

value = "•";

cellClass =
"skip-cell";

}

}

}

/* =====================
   MEASURABLE
===================== */

else{

if(log){

value =
log.value || "";

const percent =

habit.target

?

(log.value /
habit.target)
*100

: 0;

if(percent>=100){

cellClass =
"success-cell";

}
else if(
percent>=50
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

html += `

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

${value}

</div>

`;

});

html += `

</div>

`;

});

habitTable.innerHTML =
html;

}

/* =========================
   OPEN HABIT MENU
========================= */

window.openHabitMenu =
(habitId)=>{

selectedHabit =

habits.find(
h=>h.id===habitId
);

if(!selectedHabit)
return;

document
.getElementById(
"habitMenuTitle"
)
.innerText =
selectedHabit.name;

habitMenuModal
.style.display =
"flex";

};

/* =========================
   CLOSE MENU
========================= */

document
.getElementById(
"closeHabitMenuBtn"
)
.addEventListener(
"click",
()=>{

habitMenuModal
.style.display =
"none";

}
);

/* =========================
   DELETE HABIT
========================= */

window.deleteHabit =
(habitId)=>{

selectedHabit =

habits.find(
h=>h.id===habitId
);

if(!selectedHabit)
return;

document
.getElementById(
"deleteHabitText"
)
.innerText =

`Delete "${selectedHabit.name}" ?`;

deleteModal
.style.display =
"flex";

};
  /* =========================
   OPEN UPDATE MODAL
========================= */

window.openUpdateModal =
(
habitId,
date
)=>{

selectedHabit =
habits.find(
h=>h.id===habitId
);

selectedDate =
date;

if(!selectedHabit)
return;

document
.getElementById(
"updateTitle"
)
.innerText =

selectedHabit.name;

const yesNoSection =
document.getElementById(
"updateYesNoSection"
);

const measureSection =
document.getElementById(
"updateMeasureSection"
);

if(
selectedHabit.type ===
"yesno"
){

yesNoSection.style.display =
"block";

measureSection.style.display =
"none";

}
else{

yesNoSection.style.display =
"none";

measureSection.style.display =
"block";

const existingLog =
getLog(
habitId,
date
);

document
.getElementById(
"updateValue"
)
.value =

existingLog
? existingLog.value
: "";

}

updateModal.style.display =
"flex";

};

/* =========================
   CLOSE UPDATE
========================= */

document
.getElementById(
"closeUpdateModalBtn"
)
.addEventListener(
"click",
()=>{

updateModal.style.display =
"none";

}
);

/* =========================
   SAVE YES NO
========================= */

async function saveYesNoLog(
status
){

if(
!selectedHabit
||
!selectedDate
){
return;
}

try{

const existingLog =
getLog(
selectedHabit.id,
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

}
else{

await addDoc(

collection(
db,
"habitLogs"
),

{
uid:
currentUser.uid,

habitId:
selectedHabit.id,

date:
selectedDate,

status,

createdAt:
Date.now()

}

);

}

await loadLogs();

renderTable();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

}

/* =========================
   DONE
========================= */

document
.getElementById(
"markDoneBtn"
)
.addEventListener(
"click",
()=>{

saveYesNoLog(
"done"
);

}
);

/* =========================
   MISSED
========================= */

document
.getElementById(
"markMissedBtn"
)
.addEventListener(
"click",
()=>{

saveYesNoLog(
"missed"
);

}
);

/* =========================
   SKIP
========================= */

document
.getElementById(
"markSkipBtn"
)
.addEventListener(
"click",
()=>{

saveYesNoLog(
"skip"
);

}
);

/* =========================
   SAVE MEASURABLE
========================= */

document
.getElementById(
"saveMeasureProgressBtn"
)
.addEventListener(
"click",
async()=>{

if(
!selectedHabit
||
!selectedDate
){
return;
}

const value =
Number(
document
.getElementById(
"updateValue"
)
.value
);

if(
isNaN(value)
){

alert(
"Enter Value"
);

return;

}

try{

const existingLog =
getLog(
selectedHabit.id,
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

}
else{

await addDoc(

collection(
db,
"habitLogs"
),

{
uid:
currentUser.uid,

habitId:
selectedHabit.id,

date:
selectedDate,

value,

createdAt:
Date.now()

}

);

}

await loadLogs();

renderTable();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

}
);

/* =========================
   DELETE CONFIRM
========================= */

document
.getElementById(
"cancelDeleteBtn"
)
.addEventListener(
"click",
()=>{

deleteModal.style.display =
"none";

}
);

document
.getElementById(
"confirmDeleteBtn"
)
.addEventListener(
"click",
async()=>{

if(!selectedHabit)
return;

try{

await deleteDoc(

doc(
db,
"habits",
selectedHabit.id
)

);

await loadHabits();

renderTable();

updateDashboard();

deleteModal.style.display =
"none";

habitMenuModal.style.display =
"none";

}catch(error){

console.error(error);

}

}
);
  /* =========================
   STREAK CALCULATION
========================= */

function calculateStreak(
habitId
){

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit)
return 0;

const logs =

habitLogs
.filter(
log=>
log.habitId===habitId
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

if(
habit.type ===
"yesno"
){

success =
log.status ===
"done";

}
else{

success =

Number(log.value || 0)

>=

Number(habit.target || 0);

}

if(success){

streak++;

}
else{

break;

}

}

return streak;

}

/* =========================
   COMPLETION %
========================= */

function getCompletionRate(){

if(
habitLogs.length === 0
){
return 0;
}

let completed = 0;

habitLogs.forEach(log=>{

const habit =
habits.find(
h=>h.id===log.habitId
);

if(!habit)
return;

if(
habit.type==="yesno"
){

if(
log.status==="done"
){
completed++;
}

}
else{

if(
Number(log.value||0)
>=
Number(habit.target||0)
){
completed++;
}

}

});

return Math.round(

(completed /
habitLogs.length)

*100

);

}

/* =========================
   TODAY DONE
========================= */

function getTodayDone(){

const today =

new Date()
.toISOString()
.split("T")[0];

let count = 0;

habitLogs.forEach(log=>{

const habit =
habits.find(
h=>h.id===log.habitId
);

if(!habit)
return;

if(
log.date !== today
){
return;
}

if(
habit.type==="yesno"
){

if(
log.status==="done"
){
count++;
}

}
else{

if(
Number(log.value||0)
>=
Number(habit.target||0)
){
count++;
}

}

});

return count;

}

/* =========================
   DASHBOARD
========================= */

function updateDashboard(){

const totalHabits =
habits.length;

let bestStreak = 0;

habits.forEach(habit=>{

const streak =
calculateStreak(
habit.id
);

if(
streak >
bestStreak
){

bestStreak =
streak;

}

});

const currentStreak =
bestStreak;

document
.getElementById(
"currentStreak"
)
.innerText =
currentStreak;

document
.getElementById(
"bestStreak"
)
.innerText =
bestStreak;

document
.getElementById(
"completionRate"
)
.innerText =

getCompletionRate()
+ "%";

document
.getElementById(
"todayDone"
)
.innerText =
getTodayDone();

}

/* =========================
   HABIT STATS
========================= */

document
.getElementById(
"statsHabitBtn"
)
.addEventListener(
"click",
()=>{

if(!selectedHabit)
return;

const habitLogsForHabit =

habitLogs.filter(
log=>
log.habitId===
selectedHabit.id
);

document
.getElementById(
"statsCurrentStreak"
)
.innerText =

calculateStreak(
selectedHabit.id
);

document
.getElementById(
"statsBestStreak"
)
.innerText =

calculateStreak(
selectedHabit.id
);

document
.getElementById(
"statsEntries"
)
.innerText =

habitLogsForHabit.length;

let success = 0;

habitLogsForHabit.forEach(log=>{

if(
selectedHabit.type==="yesno"
){

if(
log.status==="done"
){
success++;
}

}
else{

if(
Number(log.value||0)
>=
Number(selectedHabit.target||0)
){
success++;
}

}

});

const completion =

habitLogsForHabit.length

?

Math.round(

(success /
habitLogsForHabit.length)

*100

)

:0;

document
.getElementById(
"statsCompletion"
)
.innerText =

completion + "%";

habitMenuModal.style.display =
"none";

statsModal.style.display =
"flex";

}
);

/* =========================
   CLOSE STATS
========================= */

document
.getElementById(
"closeStatsBtn"
)
.addEventListener(
"click",
()=>{

statsModal.style.display =
"none";

}
);

/* =========================
   OUTSIDE CLICK CLOSE
========================= */

window.addEventListener(
"click",
(e)=>{

if(
e.target ===
habitTypeModal
){
habitTypeModal.style.display =
"none";
}

if(
e.target ===
yesNoModal
){
yesNoModal.style.display =
"none";
}

if(
e.target ===
measurableModal
){
measurableModal.style.display =
"none";
}

if(
e.target ===
updateModal
){
updateModal.style.display =
"none";
}

if(
e.target ===
habitMenuModal
){
habitMenuModal.style.display =
"none";
}

if(
e.target ===
statsModal
){
statsModal.style.display =
"none";
}

if(
e.target ===
deleteModal
){
deleteModal.style.display =
"none";
}

}
);

/* =========================
   ESC CLOSE
========================= */

document.addEventListener(
"keydown",
(e)=>{

if(
e.key ===
"Escape"
){

habitTypeModal.style.display =
"none";

yesNoModal.style.display =
"none";

measurableModal.style.display =
"none";

updateModal.style.display =
"none";

habitMenuModal.style.display =
"none";

statsModal.style.display =
"none";

deleteModal.style.display =
"none";

}

}
);

/* =========================
   INITIAL REFRESH
========================= */

async function refreshPage(){

await loadHabits();

await loadLogs();

renderTable();

updateDashboard();

}

window.refreshHabits =
refreshPage;

/* =========================
   END
========================= */
