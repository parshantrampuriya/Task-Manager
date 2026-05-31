// =========================
// FIREBASE
// =========================

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


// =========================
// ELEMENTS
// =========================

const habitTableBody =
document.getElementById(
"habitTableBody"
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

const cancelHabitBtn =
document.getElementById(
"cancelHabitBtn"
);

const habitType =
document.getElementById(
"habitType"
);

const measurableFields =
document.getElementById(
"measurableFields"
);

const entryModal =
document.getElementById(
"entryModal"
);

const deleteModal =
document.getElementById(
"deleteModal"
);


// =========================
// STATE
// =========================

let currentUser = null;

let habits = [];

let selectedHabit = null;

let deleteHabitId = null;

let editingHabitId = null;


// =========================
// AUTH
// =========================

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


// =========================
// DATE HELPERS
// =========================

function getLast7Days(){

const dates = [];

for(let i=6;i>=0;i--){

const d =
new Date();

d.setDate(
d.getDate()-i
);

dates.push(d);

}

return dates;

}


// =========================
// HEADER DATES
// =========================

function renderDates(){

const dates =
getLast7Days();

dates.forEach(
(date,index)=>{

const el =
document.getElementById(
`day${index+1}`
);

if(el){

el.innerText =
date.getDate();

}

}
);

}

renderDates();


// =========================
// HABIT TYPE CHANGE
// =========================

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

// =========================
// LOAD HABITS
// =========================

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

renderHabits();

updateStats();

}catch(error){

console.error(error);

}

}


// =========================
// OPEN CREATE MODAL
// =========================

createHabitBtn.onclick =
()=>{

editingHabitId = null;

document.getElementById(
"habitModalTitle"
).innerText =
"➕ Create Habit";

document.getElementById(
"habitName"
).value = "";

document.getElementById(
"habitDescription"
).value = "";

document.getElementById(
"habitUnit"
).value = "";

document.getElementById(
"habitTarget"
).value = "";

habitType.value =
"yesno";

measurableFields
.style.display =
"none";

habitModal.style.display =
"flex";

};


// =========================
// CLOSE MODAL
// =========================

cancelHabitBtn.onclick =
()=>{

habitModal.style.display =
"none";

};


// =========================
// SAVE HABIT
// =========================

saveHabitBtn.onclick =
async()=>{

const name =
document.getElementById(
"habitName"
).value.trim();

const description =
document.getElementById(
"habitDescription"
).value.trim();

const type =
habitType.value;

const color =
document.getElementById(
"habitColor"
).value;

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
description,
type,
color,
unit,
target
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

description,

type,

color,

unit:
type === "measurable"
? unit
: "",

target:
type === "measurable"
? target
: 0,

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

alert(
"Error saving habit"
);

}

};


// =========================
// SEARCH
// =========================

searchInput.addEventListener(
"input",
renderHabits
);


// =========================
// DELETE HABIT
// =========================

async function deleteHabit(id){

const ok =
confirm(
"Delete this habit?"
);

if(!ok) return;

try{

await deleteDoc(

doc(
db,
"habits",
id
)

);

await loadHabits();

}catch(error){

console.error(error);

}

}


// =========================
// EDIT HABIT
// =========================

function editHabit(habit){

editingHabitId =
habit.id;

document.getElementById(
"habitModalTitle"
).innerText =
"✏ Edit Habit";

document.getElementById(
"habitName"
).value =
habit.name || "";

document.getElementById(
"habitDescription"
).value =
habit.description || "";

document.getElementById(
"habitColor"
).value =
habit.color || "#00cfff";

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

// =========================
// RENDER HABITS
// =========================

async function renderHabits(){

const search =
searchInput.value
.toLowerCase();

habitTableBody.innerHTML =
"";

const filtered =
habits.filter(h =>
h.name
.toLowerCase()
.includes(search)
);

for(const habit of filtered){

const tr =
document.createElement("tr");

let rowHTML = `

<td class="habit-name">

<div>

${habit.name}

</div>

<div class="habit-sub">

${habit.type === "measurable"
? `${habit.target} ${habit.unit}/day`
: "Yes / No Habit"}

</div>

</td>

`;

const dates =
getLast7Days();

for(const dateObj of dates){

const dateKey =
dateObj
.toISOString()
.split("T")[0];

const entry =
await getHabitEntry(
habit.id,
dateKey
);

let display = "";

let cellClass =
"empty";

if(entry){

if(
habit.type ===
"yesno"
){

if(
entry.status ===
"done"
){

display = "✓";

cellClass =
"done";

}else{

display = "✗";

cellClass =
"missed";

}

}else{

display =
entry.value || 0;

const percent =
habit.target
?
(
entry.value /
habit.target
)*100
:0;

if(percent >= 100){

cellClass =
"progress-high";

}
else if(
percent >= 50
){

cellClass =
"progress-mid";

}
else{

cellClass =
"progress-low";

}

}

}

rowHTML += `

<td
class="day-cell ${cellClass}"
data-habit="${habit.id}"
data-date="${dateKey}">

${display}

</td>

`;

}

rowHTML += `

<td>

<button
class="action-btn edit-btn"
data-id="${habit.id}">

✏

</button>

<button
class="action-btn delete-btn"
data-id="${habit.id}">

🗑

</button>

</td>

`;

tr.innerHTML =
rowHTML;

habitTableBody
.appendChild(tr);

}

/* EDIT */

document
.querySelectorAll(
".edit-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

const habit =
habits.find(
h =>
h.id ===
btn.dataset.id
);

editHabit(
habit
);

};

});

/* DELETE */

document
.querySelectorAll(
".delete-btn"
)
.forEach(btn=>{

btn.onclick = ()=>{

deleteHabit(
btn.dataset.id
);

};

});

/* CELL CLICK */

document
.querySelectorAll(
".day-cell"
)
.forEach(cell=>{

cell.onclick = ()=>{

openEntryModal(
cell.dataset.habit,
cell.dataset.date
);

};

});

}


// =========================
// GET ENTRY
// =========================

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


// =========================
// ENTRY STATE
// =========================

let currentHabitId =
null;

let currentDateKey =
null;


// =========================
// OPEN ENTRY MODAL
// =========================

function openEntryModal(
habitId,
dateKey
){

currentHabitId =
habitId;

currentDateKey =
dateKey;

const habit =
habits.find(
h =>
h.id ===
habitId
);

document.getElementById(
"entryTitle"
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

}

entryModal.style.display =
"flex";

}

// =========================
// YES / NO BUTTONS
// =========================

document.getElementById(
"doneBtn"
).onclick =
()=>{

saveYesNoEntry(
"done"
);

};

document.getElementById(
"missBtn"
).onclick =
()=>{

saveYesNoEntry(
"missed"
);

};


// =========================
// SAVE YES NO ENTRY
// =========================

async function saveYesNoEntry(
status
){

try{

const entry =
await getHabitEntry(
currentHabitId,
currentDateKey
);

if(entry){

await updateDoc(

doc(
db,
"habits",
currentHabitId,
"entries",
entry.id
),

{
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
currentDateKey,

status
}

);

}

entryModal.style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

}


// =========================
// SAVE MEASURABLE ENTRY
// =========================

document.getElementById(
"saveEntryBtn"
).onclick =
async()=>{

try{

const value =
Number(

document.getElementById(
"entryValue"
).value

);

const entry =
await getHabitEntry(
currentHabitId,
currentDateKey
);

if(entry){

await updateDoc(

doc(
db,
"habits",
currentHabitId,
"entries",
entry.id
),

{
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
currentDateKey,

value
}

);

}

entryModal.style.display =
"none";

await loadHabits();

}catch(error){

console.error(error);

}

};


// =========================
// CLOSE ENTRY MODAL
// =========================

document.getElementById(
"closeEntryBtn"
).onclick =
()=>{

entryModal.style.display =
"none";

};


// =========================
// STATS
// =========================

async function updateStats(){

let completedToday = 0;

let totalEntries = 0;

let successEntries = 0;

let bestStreak = 0;

const today =
new Date()
.toISOString()
.split("T")[0];

for(const habit of habits){

const snapshot =
await getDocs(

collection(
db,
"habits",
habit.id,
"entries"
)

);

let streak = 0;

snapshot.forEach(docSnap=>{

const data =
docSnap.data();

totalEntries++;

if(
habit.type ===
"yesno"
){

if(
data.status ===
"done"
){

successEntries++;

}

if(
data.date ===
today &&
data.status ===
"done"
){

completedToday++;

}

}else{

if(
data.value >=
habit.target
){

successEntries++;

}

if(
data.date ===
today &&
data.value >=
habit.target
){

completedToday++;

}

}

});

bestStreak =
Math.max(
bestStreak,
habit.streak || 0
);

}

const successRate =
totalEntries
?
Math.round(
(successEntries /
totalEntries)
*100
)
:0;

document.getElementById(
"totalHabits"
).innerText =
habits.length;

document.getElementById(
"completedToday"
).innerText =
completedToday;

document.getElementById(
"currentStreak"
).innerText =
bestStreak;

document.getElementById(
"successRate"
).innerText =
successRate + "%";

}


// =========================
// CLOSE MODAL ON OUTSIDE CLICK
// =========================

window.addEventListener(
"click",
(e)=>{

if(
e.target === habitModal
){

habitModal.style.display =
"none";

}

if(
e.target === entryModal
){

entryModal.style.display =
"none";

}

if(
e.target === deleteModal
){

deleteModal.style.display =
"none";

}

}
);


// =========================
// INITIAL UI
// =========================

measurableFields
.style.display =
"none";


// =========================
// END
// =========================
