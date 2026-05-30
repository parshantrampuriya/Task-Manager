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
getDocs
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let currentUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="index.html";
return;

}

currentUser = user;

setupPreview();

});

/* ================= PREVIEW ================= */

function setupPreview(){

const fields = [

"habitName",
"habitIcon",
"habitCategory",
"habitDifficulty"

];

fields.forEach(id=>{

const el =
document.getElementById(id);

if(el){

el.addEventListener(
"input",
updatePreview
);

el.addEventListener(
"change",
updatePreview
);

}

});

updatePreview();

}

/* ================= UPDATE PREVIEW ================= */

function updatePreview(){

const preview =
document.getElementById(
"previewContainer"
);

if(!preview) return;

const name =
document.getElementById("habitName")?.value
|| "New Habit";

const icon =
document.getElementById("habitIcon")?.value
|| "🎯";

const category =
document.getElementById("habitCategory")?.value
|| "General";

const difficulty =
document.getElementById("habitDifficulty")?.value
|| "Easy";

preview.innerHTML =

`
<div class="preview-card">

<div class="preview-left">

<div class="preview-icon">
${icon}
</div>

<div>

<div class="preview-name">
${name}
</div>

<div class="preview-meta">
${category} • ${difficulty}
</div>

</div>

</div>

</div>
`;

}

/* ================= XP AUTO ================= */

function calculateXP(difficulty){

switch(difficulty){

case "Easy":
return 10;

case "Medium":
return 20;

case "Hard":
return 40;

default:
return 10;

}

}

/* ================= CHECK DUPLICATE ================= */

async function habitExists(name){

const snapshot =
await getDocs(
collection(db,"habits")
);

let exists = false;

snapshot.forEach(doc=>{

const h = doc.data();

if(

h.uid === currentUser.uid &&
h.name.toLowerCase() ===
name.toLowerCase()

){

exists = true;

}

});

return exists;

}

/* ================= SAVE HABIT ================= */

window.saveHabit = async()=>{

try{

const name =
document.getElementById("habitName")
?.value.trim();

if(!name){

alert(
"Please enter habit name"
);

return;

}

/* duplicate */

const duplicate =
await habitExists(name);

if(duplicate){

alert(
"Habit already exists"
);

return;

}

const icon =
document.getElementById("habitIcon")
?.value || "🎯";

const category =
document.getElementById("habitCategory")
?.value || "General";

const frequency =
document.getElementById("habitFrequency")
?.value || "Daily";

const target =
parseInt(
document.getElementById(
"habitTarget"
)?.value || 1
);

const reminder =
document.getElementById(
"habitReminder"
)?.value || "";

const color =
document.getElementById(
"habitColor"
)?.value || "#00e5ff";

const difficulty =
document.getElementById(
"habitDifficulty"
)?.value || "Easy";

const notes =
document.getElementById(
"habitNotes"
)?.value || "";

let xp =
parseInt(
document.getElementById(
"habitXP"
)?.value
);

if(!xp){

xp =
calculateXP(
difficulty
);

}

/* save */

await addDoc(
collection(db,"habits"),
{

name:name,

icon:icon,

category:category,

frequency:frequency,

target:target,

reminder:reminder,

color:color,

difficulty:difficulty,

xp:xp,

notes:notes,

streak:0,

longestStreak:0,

completedDates:[],

createdAt:Date.now(),

uid:currentUser.uid

}
);

alert(
"Habit Created Successfully"
);

location.href =
"habit.html";

}catch(err){

console.log(err);

alert(
"Error:\n" +
err.message
);

}

};

/* ================= TEMPLATES ================= */

window.loadTemplate=(type)=>{

if(type==="reading"){

habitName.value =
"Read Book";

habitIcon.value =
"📚";

habitCategory.value =
"Study";

habitDifficulty.value =
"Medium";

habitTarget.value = 10;

}

if(type==="gym"){

habitName.value =
"Workout";

habitIcon.value =
"💪";

habitCategory.value =
"Fitness";

habitDifficulty.value =
"Hard";

habitTarget.value = 1;

}

if(type==="water"){

habitName.value =
"Drink Water";

habitIcon.value =
"💧";

habitCategory.value =
"Health";

habitDifficulty.value =
"Easy";

habitTarget.value = 8;

}

if(type==="meditation"){

habitName.value =
"Meditation";

habitIcon.value =
"🧘";

habitCategory.value =
"Health";

habitDifficulty.value =
"Medium";

habitTarget.value = 15;

}

if(type==="coding"){

habitName.value =
"Coding Practice";

habitIcon.value =
"💻";

habitCategory.value =
"Career";

habitDifficulty.value =
"Hard";

habitTarget.value = 60;

}

updatePreview();

};

/* ================= AUTO XP ================= */

const difficultyInput =
document.getElementById(
"habitDifficulty"
);

if(difficultyInput){

difficultyInput.addEventListener(
"change",
()=>{

const xpBox =
document.getElementById(
"habitXP"
);

if(xpBox){

xpBox.value =
calculateXP(
difficultyInput.value
);

}

}
);

}