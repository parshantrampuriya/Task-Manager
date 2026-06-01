import { auth, db } from "./firebase.js";

import {
collection,
doc,
addDoc,
updateDoc,
deleteDoc,
getDocs,
query,
where
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =====================================
   ELEMENTS
===================================== */

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

const searchInput =
document.getElementById("searchInput");

/* =====================================
   STATE
===================================== */

let currentUser = null;

let habits = [];

let habitLogs = [];

let editingHabitId = null;

/* =====================================
   TEMPLATES
===================================== */

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
}

};

/* =====================================
   AUTH
===================================== */

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

await loadLogs();

renderGrid();

}
);

/* =====================================
   LAST 30 DAYS
===================================== */

function getLast30Days(){

const days = [];

for(let i=29;i>=0;i--){

const d = new Date();

d.setDate(
d.getDate()-i
);

days.push({

date:
d.toISOString()
.split("T")[0],

day:
d.getDate(),

month:
d.toLocaleString(
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

/* =====================================
   LOAD HABITS
===================================== */

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

/* =====================================
   LOAD LOGS
===================================== */

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

/* =====================================
   OPEN CREATE MODAL
===================================== */

createHabitBtn.onclick =
()=>{

editingHabitId = null;

document.getElementById(
"habitForm"
).reset();

document.getElementById(
"modalTitle"
).innerText =
"➕ Create Habit";

habitModal.style.display =
"flex";

};

/* =====================================
   CLOSE MODAL
===================================== */

if(cancelHabitBtn){

   cancelHabitBtn.onclick = ()=>{

      habitModal.style.display = "none";

   };

}

/* =====================================
   HABIT TYPE
===================================== */

document.getElementById(
"habitType"
).addEventListener(
"change",
()=>{

const type =
document.getElementById(
"habitType"
).value;

const measurableBox =
document.getElementById(
"measurableFields"
);

if(
type ===
"measurable"
){

measurableBox.style.display =
"block";

}else{

measurableBox.style.display =
"none";

}

}
);

/* =====================================
   TEMPLATE SELECT
===================================== */

document.getElementById(
"templateSelect"
).addEventListener(
"change",
()=>{

const key =
document.getElementById(
"templateSelect"
).value;

if(!templates[key])
return;

const template =
templates[key];

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

document.getElementById(
"habitType"
).value =
"measurable";

document.getElementById(
"measurableFields"
).style.display =
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

document.getElementById(
"habitType"
).value =
"yesno";

document.getElementById(
"measurableFields"
).style.display =
"none";

}

}
);

/* =====================================
   SAVE HABIT
===================================== */

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
"Habit Name Required"
);

return;

}

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

if(
type ===
"measurable"
){

habitData.unit =
document.getElementById(
"habitUnit"
).value;

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

try{

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
"Error Saving Habit"
);

}

};
/* =====================================
   EDIT HABIT
===================================== */

window.editHabit =
(habitId)=>{

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit) return;

editingHabitId =
habit.id;

document.getElementById(
"modalTitle"
).innerText =
"✏ Edit Habit";

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
habit.color || "#00cfff";

document.getElementById(
"habitNotes"
).value =
habit.notes || "";

if(
habit.type ===
"measurable"
){

document.getElementById(
"measurableFields"
).style.display =
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

}
else{

document.getElementById(
"measurableFields"
).style.display =
"none";

}

habitModal.style.display =
"flex";

};

/* =====================================
   DELETE HABIT
===================================== */

window.deleteHabit =
async(habitId)=>{

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit) return;

const ok =
confirm(
`Delete "${habit.name}" ?`
);

if(!ok) return;

try{

await deleteDoc(
doc(
db,
"habits",
habitId
)
);

await loadHabits();

renderGrid();

updateDashboard();

}catch(error){

console.error(error);

}

};

/* =====================================
   SEARCH
===================================== */

searchInput.addEventListener(
"input",
()=>{

renderGrid();

}
);

/* =====================================
   GET LOG
===================================== */

function getLog(
habitId,
date
){

return habitLogs.find(
log=>
log.habitId===habitId
&&
log.date===date
);

}

/* =====================================
   RENDER GRID
===================================== */

function renderGrid(){

if(!habitsGrid)
return;

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

const showMonth =

day.month !== lastMonth;

if(showMonth){

lastMonth =
day.month;

}

header += `

<div class="day-wrapper">

<div class="month-name">

${showMonth ? day.month : ""}

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
   RENDER HABITS
========================== */

filteredHabits.forEach(habit=>{

let row = `

<div class="habit-row">

<div
class="habit-info"
style="
border-left:
5px solid ${habit.color};
">

<div class="habit-name">

${habit.name}

</div>

<div class="habit-small">

${habit.type==="yesno"

? "✅ Yes / No"

: `🎯 ${habit.target} ${habit.unit}`}

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

let value = "";

let className =
"empty-cell";

/* YES NO */

if(
habit.type==="yesno"
){

if(log){

if(
log.status==="done"
){

value="✓";
className="done-cell";

}
else if(
log.status==="missed"
){

value="✗";
className="missed-cell";

}
else{

value="•";
className="skip-cell";

}

}

}

/* MEASURABLE */

else{

if(log){

value =
log.value || "";

const percent =

habit.target
?

(log.value /
habit.target) * 100

: 0;

if(percent >= 100){

className =
"success-cell";

}
else if(
percent >= 50
){

className =
"warning-cell";

}
else{

className =
"danger-cell";

}

}

}

row += `

<div
class="
habit-day
${className}
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

row += `

</div>

`;

habitsGrid.innerHTML +=
row;

});

}
/* =====================================
   UPDATE MODAL
===================================== */

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

let selectedHabitId =
null;

let selectedDate =
null;

/* =====================================
   OPEN UPDATE MODAL
===================================== */

window.openUpdateModal =
(
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
else{

yesNoSection
.style.display =
"none";

measureSection
.style.display =
"block";

const log =
getLog(
habitId,
date
);

document.getElementById(
"todayValue"
).value =

log
? log.value
: "";

document.getElementById(
"todayProgress"
).innerText =

`Target:
${habit.target}
${habit.unit}`;

}

};

/* =====================================
   CLOSE UPDATE MODAL
===================================== */

document.getElementById(
"closeUpdateBtn"
).onclick =
()=>{

updateModal.style.display =
"none";

};

/* =====================================
   SAVE YES NO
===================================== */

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
selectedHabitId,

date:
selectedDate,

status
}

);

}

await loadLogs();

renderGrid();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

}

/* =====================================
   DONE
===================================== */

document.getElementById(
"doneBtn"
).onclick =
()=>{

saveYesNoLog(
"done"
);

};

/* =====================================
   MISSED
===================================== */

document.getElementById(
"missedBtn"
).onclick =
()=>{

saveYesNoLog(
"missed"
);

};

/* =====================================
   SKIP
===================================== */

document.getElementById(
"skipBtn"
).onclick =
()=>{

saveYesNoLog(
"skip"
);

};

/* =====================================
   SAVE MEASURABLE
===================================== */

document.getElementById(
"saveProgressBtn"
).onclick =
async()=>{

const value =
Number(
document.getElementById(
"todayValue"
).value
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
selectedHabitId,

date:
selectedDate,

value
}

);

}

await loadLogs();

renderGrid();

updateDashboard();

updateModal.style.display =
"none";

}catch(error){

console.error(error);

}

};

/* =====================================
   STREAK
===================================== */

function calculateStreak(
habitId
){

const logs =

habitLogs.filter(
log=>
log.habitId===habitId
);

let streak = 0;

logs.forEach(log=>{

const habit =
habits.find(
h=>h.id===habitId
);

if(!habit) return;

if(
habit.type==="yesno"
){

if(
log.status==="done"
){

streak++;

}

}
else{

if(
log.value >=
habit.target
){

streak++;

}

}

});

return streak;

}

/* =====================================
   DASHBOARD
===================================== */

function updateDashboard(){

const totalHabitsEl =
document.getElementById(
"totalHabits"
);

const currentStreakEl =
document.getElementById(
"currentStreak"
);

const bestStreakEl =
document.getElementById(
"bestStreak"
);

const completionRateEl =
document.getElementById(
"completionRate"
);

const todayDoneEl =
document.getElementById(
"todayDone"
);

let completed = 0;

let total = 0;

let bestStreak = 0;

const today =
new Date()
.toISOString()
.split("T")[0];

let todayDone = 0;

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

habitLogs.forEach(log=>{

const habit =
habits.find(
h=>h.id===log.habitId
);

if(!habit)
return;

total++;

let success =
false;

if(
habit.type==="yesno"
){

success =
log.status==="done";

}
else{

success =
log.value >=
habit.target;

}

if(success){

completed++;

}

if(
success &&
log.date===today
){

todayDone++;

}

});

const completionRate =

total>0

?

Math.round(
(completed/total)*100
)

:0;

if(totalHabitsEl)
totalHabitsEl.innerText =
habits.length;

if(currentStreakEl)
currentStreakEl.innerText =
bestStreak;

if(bestStreakEl)
bestStreakEl.innerText =
bestStreak;

if(completionRateEl)
completionRateEl.innerText =
completionRate + "%";

if(todayDoneEl)
todayDoneEl.innerText =
todayDone;

}

/* =====================================
   CLOSE MODALS
===================================== */

window.addEventListener(
"click",
(e)=>{

if(
e.target===habitModal
){

habitModal.style.display =
"none";

}

if(
e.target===updateModal
){

updateModal.style.display =
"none";

}

}
);

/* =====================================
   INITIAL LOAD
===================================== */

setTimeout(()=>{

renderGrid();

updateDashboard();

},500);
