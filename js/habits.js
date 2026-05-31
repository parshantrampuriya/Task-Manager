import { auth, db }
from "./firebase.js";

import {

collection,
addDoc,
getDocs,
getDoc,
doc,
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

/* =========================
   ELEMENTS
========================= */

const habitTable =
document.getElementById(
"habitTable"
);

const searchInput =
document.getElementById(
"searchInput"
);

const createHabitBtn =
document.getElementById(
"createHabitBtn"
);

const habitModal =
document.getElementById(
"habitModal"
);

const saveHabitBtn =
document.getElementById(
"saveHabitBtn"
);

const closeHabitBtn =
document.getElementById(
"closeHabitBtn"
);

const habitType =
document.getElementById(
"habitType"
);

const measurableFields =
document.getElementById(
"measurableFields"
);

/* =========================
   STATE
========================= */

let currentUser = null;

let habits = [];

let selectedHabit = null;

let editingHabitId = null;

let deletingHabitId = null;

/* =========================
   AUTH
========================= */

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

}
);

/* =========================
   DATE HELPERS
========================= */

function getLast30Days(){

const dates = [];

for(let i=29;i>=0;i--){

const d =
new Date();

d.setDate(
d.getDate()-i
);

dates.push(d);

}

return dates;

}

function formatDate(date){

return date
.toISOString()
.split("T")[0];

}

function shortMonth(date){

return date
.toLocaleString(
"en-US",
{
month:"short"
}
);

}

/* =========================
   HABIT TYPE
========================= */

habitType.onchange =
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

};

/* =========================
   MODAL OPEN
========================= */

createHabitBtn.onclick =
()=>{

editingHabitId = null;

document.getElementById(
"habitName"
).value = "";

document.getElementById(
"habitQuestion"
).value = "";

document.getElementById(
"habitUnit"
).value = "";

document.getElementById(
"habitTarget"
).value = "";

document.getElementById(
"habitNotes"
).value = "";

habitModal.style.display =
"flex";

};
/* =========================
   LOAD HABITS
========================= */

async function loadHabits(){

try{

const q =
query(
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

snapshot.forEach(docSnap=>{

habits.push({

id:docSnap.id,

...docSnap.data()

});

});

renderHabits();

updateDashboard();

}catch(error){

console.error(error);

}

}

/* =========================
   CLOSE MODAL
========================= */

closeHabitBtn.onclick =
()=>{

habitModal.style.display =
"none";

};

/* =========================
   SAVE HABIT
========================= */

saveHabitBtn.onclick =
async()=>{

const name =
document.getElementById(
"habitName"
).value.trim();

const question =
document.getElementById(
"habitQuestion"
).value.trim();

const type =
habitType.value;

const unit =
document.getElementById(
"habitUnit"
).value;

const target =
Number(
document.getElementById(
"habitTarget"
).value
);

const targetType =
document.getElementById(
"targetType"
).value;

const color =
document.getElementById(
"habitColor"
).value;

const notes =
document.getElementById(
"habitNotes"
).value;

if(!name){

alert(
"Habit name required"
);

return;

}

try{

if(editingHabitId){

await updateDoc(

doc(
db,
"habits",
editingHabitId
),

{
name,
question,
type,
unit,
target,
targetType,
color,
notes
}

);

}else{

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

type,

unit,

target,

targetType,

color,

notes,

streak:0,

bestStreak:0,

createdAt:
Date.now()

}

);

}

habitModal.style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

};

/* =========================
   EDIT HABIT
========================= */

function editHabit(habit){

editingHabitId =
habit.id;

document.getElementById(
"habitName"
).value =
habit.name || "";

document.getElementById(
"habitQuestion"
).value =
habit.question || "";

habitType.value =
habit.type || "yesno";

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

document.getElementById(
"habitColor"
).value =
habit.color ||
"#00cfff";

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

}else{

measurableFields
.style.display =
"none";

}

habitModal.style.display =
"flex";

}

/* =========================
   DELETE HABIT
========================= */

function askDeleteHabit(id){

deletingHabitId =
id;

const habit =
habits.find(
h=>h.id===id
);

document.getElementById(
"deleteHabitName"
).innerText =
habit.name;

document.getElementById(
"deleteModal"
).style.display =
"flex";

}

document.getElementById(
"cancelDeleteBtn"
).onclick =
()=>{

document.getElementById(
"deleteModal"
).style.display =
"none";

};

document.getElementById(
"confirmDeleteBtn"
).onclick =
async()=>{

try{

await deleteDoc(

doc(
db,
"habits",
deletingHabitId
)

);

document.getElementById(
"deleteModal"
).style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

};

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
"input",
()=>{

renderHabits();

}
);
/* =========================
   RENDER HABITS
========================= */

async function renderHabits(){

const search =
searchInput.value
.toLowerCase();

habitTable.innerHTML =
"";

const dates =
getLast30Days();

/* =========================
   MONTH HEADER
========================= */

let monthRow = `

<div class="month-row">

<div class="month-cell month-left">

Habits

</div>

`;

dates.forEach(date=>{

monthRow += `

<div class="month-cell">

${shortMonth(date)}

</div>

`;

});

monthRow += `

</div>

`;

habitTable.innerHTML +=
monthRow;

/* =========================
   DATE HEADER
========================= */

let dateHeader = `

<div class="date-header">

<div class="habit-header">

Habit

</div>

`;

dates.forEach((date,index)=>{

const today =
index === dates.length-1;

dateHeader += `

<div class="
date-cell
${today ? "today-column" : ""}
">

${date.getDate()}

<span>

${shortMonth(date)}

</span>

</div>

`;

});

dateHeader += `

</div>

`;

habitTable.innerHTML +=
dateHeader;

/* =========================
   FILTER
========================= */

const filtered =
habits.filter(h=>{

return h.name
.toLowerCase()
.includes(search);

});

/* =========================
   HABIT ROWS
========================= */

for(const habit of filtered){

let rowHTML = `

<div class="habit-row">

<div
class="habit-info"
style="
border-left:
6px solid
${habit.color};
">

<div class="habit-name">

${habit.name}

</div>

<div class="habit-meta">

${habit.type === "measurable"

? `${habit.target}
${habit.unit}`

: "Yes / No Habit"}

</div>

<div class="habit-actions">

<button
class="edit-btn"
data-id="${habit.id}">

✏

</button>

<button
class="delete-btn"
data-id="${habit.id}">

🗑

</button>

</div>

</div>

`;

for(const date of dates){

const dateKey =
formatDate(date);

const entry =
await getHabitEntry(
habit.id,
dateKey
);

let text = "";

let statusClass =
"status-empty";

if(entry){

if(
habit.type ===
"yesno"
){

if(
entry.status ===
"done"
){

text = "✓";

statusClass =
"status-done";

}

else if(
entry.status ===
"missed"
){

text = "✗";

statusClass =
"status-missed";

}

else{

text = "⏭";

statusClass =
"status-skip";

}

}

else{

text =
entry.value || 0;

statusClass =
"status-progress";

}

}

rowHTML += `

<div
class="
track-cell
${statusClass}
"
data-habit="${habit.id}"
data-date="${dateKey}">

${text}

</div>

`;

}

rowHTML += `

</div>

`;

habitTable.innerHTML +=
rowHTML;

}

/* =========================
   CELL EVENTS
========================= */

document
.querySelectorAll(
".track-cell"
)
.forEach(cell=>{

cell.onclick =
()=>{

openUpdateModal(

cell.dataset.habit,

cell.dataset.date

);

};

});

/* =========================
   EDIT EVENTS
========================= */

document
.querySelectorAll(
".edit-btn"
)
.forEach(btn=>{

btn.onclick =
()=>{

const habit =
habits.find(
h=>
h.id ===
btn.dataset.id
);

editHabit(
habit
);

};

});

/* =========================
   DELETE EVENTS
========================= */

document
.querySelectorAll(
".delete-btn"
)
.forEach(btn=>{

btn.onclick =
()=>{

askDeleteHabit(
btn.dataset.id
);

};

});

}

/* =========================
   ENTRY HELPER
========================= */

async function getHabitEntry(
habitId,
dateKey
){

const snapshot =
await getDocs(

collection(
db,
"habits",
habitId,
"entries"
)

);

let result =
null;

snapshot.forEach(docSnap=>{

const data =
docSnap.data();

if(
data.date ===
dateKey
){

result = {

id:docSnap.id,

...data

};

}

});

return result;

}

/* =========================
   UPDATE MODAL
========================= */

let currentHabitId = null;
let currentDate = null;

function openUpdateModal(
habitId,
date
){

currentHabitId =
habitId;

currentDate =
date;

const habit =
habits.find(
h=>h.id===habitId
);

document.getElementById(
"updateTitle"
).innerText =
habit.name;

if(
habit.type ===
"yesno"
){

document.getElementById(
"yesNoSection"
).style.display =
"block";

document.getElementById(
"measureSection"
).style.display =
"none";

}else{

document.getElementById(
"yesNoSection"
).style.display =
"none";

document.getElementById(
"measureSection"
).style.display =
"block";

document.getElementById(
"todayValue"
).value = "";

document.getElementById(
"todayProgress"
).innerText =
`Target:
${habit.target}
${habit.unit}`;

}

document.getElementById(
"updateModal"
).style.display =
"flex";

}

/* =========================
   CLOSE UPDATE MODAL
========================= */

document.getElementById(
"closeUpdateBtn"
).onclick =
()=>{

document.getElementById(
"updateModal"
).style.display =
"none";

};

/* =========================
   YES NO SAVE
========================= */

document.getElementById(
"doneBtn"
).onclick =
()=>{

saveYesNo(
"done"
);

};

document.getElementById(
"missedBtn"
).onclick =
()=>{

saveYesNo(
"missed"
);

};

document.getElementById(
"skipBtn"
).onclick =
()=>{

saveYesNo(
"skip"
);

};

async function saveYesNo(
status
){

try{

const existing =
await getHabitEntry(
currentHabitId,
currentDate
);

if(existing){

await updateDoc(

doc(
db,
"habits",
currentHabitId,
"entries",
existing.id
),

{
date:
currentDate,
status
}

);

}else{

await addDoc(

collection(
db,
"habits",
currentHabitId,
"entries"
),

{
date:
currentDate,
status
}

);

}

document.getElementById(
"updateModal"
).style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

}

/* =========================
   SAVE MEASURABLE
========================= */

document.getElementById(
"saveProgressBtn"
).onclick =
async()=>{

try{

const value =
Number(

document.getElementById(
"todayValue"
).value

);

const existing =
await getHabitEntry(
currentHabitId,
currentDate
);

if(existing){

await updateDoc(

doc(
db,
"habits",
currentHabitId,
"entries",
existing.id
),

{
date:
currentDate,
value
}

);

}else{

await addDoc(

collection(
db,
"habits",
currentHabitId,
"entries"
),

{
date:
currentDate,
value
}

);

}

document.getElementById(
"updateModal"
).style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

};

/* =========================
   STREAK
========================= */

async function calculateStreak(
habitId
){

const snapshot =
await getDocs(

collection(
db,
"habits",
habitId,
"entries"
)

);

let dates = [];

snapshot.forEach(docSnap=>{

const data =
docSnap.data();

if(
data.status === "done"
||
data.value > 0
){

dates.push(
data.date
);

}

});

dates.sort();

let streak = 0;

for(
let i=
dates.length-1;
i>=0;
i--
){

streak++;

}

return streak;

}

/* =========================
   DASHBOARD
========================= */

async function updateDashboard(){

let completed = 0;

let total = 0;

let bestStreak = 0;

const today =
formatDate(
new Date()
);

for(const habit of habits){

const streak =
await calculateStreak(
habit.id
);

if(
streak >
bestStreak
){

bestStreak =
streak;

}

const snapshot =
await getDocs(

collection(
db,
"habits",
habit.id,
"entries"
)

);

snapshot.forEach(docSnap=>{

const data =
docSnap.data();

total++;

if(
habit.type ===
"yesno"
){

if(
data.status ===
"done"
){

completed++;

}

}else{

if(
data.value >=
habit.target
){

completed++;

}

}

});

const todayEntry =
await getHabitEntry(
habit.id,
today
);

if(todayEntry){

document.getElementById(
"todayDone"
).innerText =
Number(
document.getElementById(
"todayDone"
).innerText
) + 1;

}

}

const percent =
total
?
Math.round(
(completed/total)
*100
)
:0;

document.getElementById(
"bestStreak"
).innerText =
bestStreak;

document.getElementById(
"currentStreak"
).innerText =
bestStreak;

document.getElementById(
"completionRate"
).innerText =
percent + "%";

}

/* =========================
   MODAL CLOSE
========================= */

window.onclick =
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
document.getElementById(
"updateModal"
)
){

document.getElementById(
"updateModal"
).style.display =
"none";

}

if(
e.target ===
document.getElementById(
"deleteModal"
)
){

document.getElementById(
"deleteModal"
).style.display =
"none";

}

};