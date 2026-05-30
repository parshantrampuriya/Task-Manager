import { auth, db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
deleteDoc,
updateDoc,
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

const goalContainer =
document.getElementById("goalContainer");

const createGoalBtn =
document.getElementById("createGoalBtn");

const goalModal =
document.getElementById("goalModal");

const saveGoalBtn =
document.getElementById("saveGoalBtn");

const cancelGoalBtn =
document.getElementById("cancelGoalBtn");

const searchInput =
document.getElementById("searchInput");

/* =========================
   STATE
========================= */

let currentUser = null;
let goals = [];
let editGoalId = null;

/* =========================
   AUTH
========================= */

onAuthStateChanged(auth, async (user) => {

if (!user) {

window.location.href =
"index.html";

return;

}

currentUser = user;

await loadGoals();

});

/* =========================
   MODAL
========================= */

createGoalBtn.onclick = () => {

editGoalId = null;

document.getElementById("goalName").value = "";
document.getElementById("startDate").value = "";
document.getElementById("endDate").value = "";
document.getElementById("goalDescription").value = "";

goalModal.style.display = "flex";

};

cancelGoalBtn.onclick = () => {

goalModal.style.display = "none";

};

/* =========================
   SAVE GOAL
========================= */

saveGoalBtn.onclick = async () => {

const name =
document.getElementById("goalName").value.trim();

const startDate =
document.getElementById("startDate").value;

const endDate =
document.getElementById("endDate").value;

const description =
document.getElementById("goalDescription").value;

if (!name) {

alert("Goal name required");

return;

}

try {

if (editGoalId) {

await updateDoc(

doc(db, "goals", editGoalId),

{
name,
startDate,
endDate,
description
}

);

} else {

await addDoc(

collection(db, "goals"),

{
uid: currentUser.uid,
name,
startDate,
endDate,
description,
progress: 0,
status: "active",
createdAt: Date.now()
}

);

}

goalModal.style.display = "none";

await loadGoals();

} catch (error) {

console.error(error);

alert("Error saving goal");

}

};

/* =========================
   LOAD GOALS
========================= */

async function loadGoals() {

const q = query(
collection(db, "goals"),
where("uid", "==", currentUser.uid)
);

const snapshot =
await getDocs(q);

goals = [];

snapshot.forEach((docSnap) => {

goals.push({
id: docSnap.id,
...docSnap.data()
});

});

renderGoals();
updateStats();

}

/* =========================
   RENDER GOALS
========================= */

function renderGoals() {

const searchText =
searchInput.value.toLowerCase();

goalContainer.innerHTML = "";

const filteredGoals =
goals.filter(goal =>
goal.name
.toLowerCase()
.includes(searchText)
);

if (filteredGoals.length === 0) {

goalContainer.innerHTML = `

<div class="goal-card">

<h3>
🎯 No Goals Found
</h3>

<p>
Create your first goal.
</p>

</div>

`;

return;

}

filteredGoals.forEach(goal => {

const card =
document.createElement("div");

card.className =
"goal-card";

card.innerHTML = `

<div class="goal-title">

${goal.name}

</div>

<div class="goal-info">

📅 Start:
${goal.startDate || "-"}

</div>

<div class="goal-info">

🏁 End:
${goal.endDate || "-"}

</div>

<div class="goal-progress">

<div class="goal-progress-bar">

<div
class="goal-progress-fill"
style="width:${goal.progress || 0}%">

</div>

</div>

</div>

<div class="goal-info">

Progress:
${goal.progress || 0}%

</div>

<div class="goal-status status-active">

${goal.status || "active"}

</div>

<div class="goal-actions">

<button
class="edit-btn">

✏ Edit

</button>

<button
class="delete-btn">

🗑 Delete

</button>

</div>

`;

card.addEventListener("click", () => {

window.location.href =
`goal-details.html?id=${goal.id}`;

});

card.querySelector(".edit-btn")
.addEventListener("click",
(e) => {

e.stopPropagation();

editGoal(goal);

});

card.querySelector(".delete-btn")
.addEventListener("click",
async (e) => {

e.stopPropagation();

const ok =
confirm(
"Delete this goal?"
);

if (!ok) return;

await deleteDoc(
doc(
db,
"goals",
goal.id
)
);

await loadGoals();

});

goalContainer.appendChild(card);

});

}

/* =========================
   EDIT
========================= */

function editGoal(goal) {

editGoalId = goal.id;

document.getElementById("goalName").value =
goal.name || "";

document.getElementById("startDate").value =
goal.startDate || "";

document.getElementById("endDate").value =
goal.endDate || "";

document.getElementById("goalDescription").value =
goal.description || "";

goalModal.style.display =
"flex";

}

/* =========================
   STATS
========================= */

function updateStats() {

const active =
goals.filter(
g => g.status !== "completed"
).length;

const completed =
goals.filter(
g => g.status === "completed"
).length;

const overdue =
goals.filter(g => {

if (!g.endDate)
return false;

return (
new Date(g.endDate)
< new Date()
&& g.progress < 100
);

}).length;

const overall =
goals.length
?
Math.round(

goals.reduce(
(sum, g) =>
sum + (g.progress || 0),
0
)
/ goals.length

)
: 0;

document.getElementById(
"activeGoals"
).innerText = active;

document.getElementById(
"completedGoals"
).innerText = completed;

document.getElementById(
"overdueGoals"
).innerText = overdue;

document.getElementById(
"overallProgress"
).innerText =
overall + "%";

document.getElementById(
"progressText"
).innerText =
overall + "%";

document.getElementById(
"progressFill"
).style.width =
overall + "%";

}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
"input",
renderGoals
);