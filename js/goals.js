import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
onSnapshot,
doc,
updateDoc,
deleteDoc,
getDocs,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= DOM ================= */
const username = document.getElementById("username");
const goalContainer = document.getElementById("goalContainer");
const goalName = document.getElementById("goalName");
const goalTotal = document.getElementById("goalTotal");
const goalDeadline = document.getElementById("goalDeadline");
const addBtn = document.getElementById("addBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalName = document.getElementById("modalName");
const modalInput = document.getElementById("modalInput");
const modalDate = document.getElementById("modalDate");

/* ================= GLOBAL ================= */
let currentUser = null;
let goals = [];

let currentIndex = null;
let currentMode = null;

/* VIEW MODE */
const params = new URLSearchParams(location.search);
const viewUser = params.get("viewUser");

let uid = null;
let realUid = null;
let isViewMode = false;
let friendPermission = null;

/* ================= INIT ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
window.location.href="index.html";
return;
}

currentUser = user;
realUid = user.uid;

/* friend mode */
if(viewUser){
uid = viewUser;
isViewMode = true;
}else{
uid = realUid;
}

/* user name */
const snap = await getDoc(doc(db,"users",uid));

if(snap.exists()){

const name = snap.data().name || "User";

if(isViewMode){

username.innerText = "👀 Viewing " + name;

/* permission check */
const allowed = await checkFriendPermission();

if(!allowed){
showBlockedPage(name);
return;
}

hideControls();

}else{

username.innerText = "👤 Welcome " + name;

}

}

/* normal add button */
if(!isViewMode && addBtn){
addBtn.addEventListener("click", addGoal);
}

loadGoals();

});

/* ================= PERMISSION ================= */
async function checkFriendPermission(){

const snap = await getDocs(collection(db,"friends"));

for(const d of snap.docs){

const data = d.data();
const users = data.users || [];

if(
users.includes(realUid) &&
users.includes(uid)
){

friendPermission =
data.permissions?.[uid] || {};

return friendPermission.goals === true;

}

}

return false;

}

/* ================= BLOCK PAGE ================= */
function showBlockedPage(name){

goalContainer.innerHTML = `
<div style="
padding:60px 30px;
text-align:center;
background:#111827;
border-radius:18px;
box-shadow:0 0 25px rgba(0,255,255,.15);
">

<div style="font-size:60px;">🔒</div>

<h2 style="margin-top:15px;">
${name} blocked this page
</h2>

<p style="opacity:.8;margin-top:10px;">
Your friend has restricted access.
</p>

<button onclick="location.href='home.html'"
style="
margin-top:25px;
padding:14px 24px;
border:none;
border-radius:14px;
font-weight:700;
cursor:pointer;
background:linear-gradient(45deg,#00eaff,#00ff9d);
">
↩ My Dashboard
</button>

</div>
`;

}

/* ================= HIDE CONTROLS ================= */
function hideControls(){

if(goalName) goalName.style.display = "none";
if(goalTotal) goalTotal.style.display = "none";
if(goalDeadline) goalDeadline.style.display = "none";
if(addBtn) addBtn.style.display = "none";

}

/* ================= LOAD ================= */
function loadGoals(){

onSnapshot(collection(db,"goals"), snap=>{

goals = [];

snap.forEach(d=>{

let g = d.data();

if(g.user === uid){

goals.push({
id:d.id,
...g
});

}

});

goals.sort((a,b)=>
(a.order || 0) - (b.order || 0)
);

render();

if(!isViewMode){
setTimeout(enableDrag,0);
}

});

}

/* ================= ADD ================= */
async function addGoal(){

if(isViewMode) return;

let name = goalName.value.trim();
let total = Number(goalTotal.value);
let deadline = goalDeadline.value;

if(!name || !total){
alert("Enter name & total");
return;
}

await addDoc(collection(db,"goals"),{
name,
total,
done:0,
deadline:deadline || null,
user:realUid,
order:Date.now()
});

goalName.value = "";
goalTotal.value = "";
goalDeadline.value = "";

}

/* ================= RENDER ================= */
function render(){

let html = "";

goals.forEach((g,i)=>{

let percent = Math.min(
(g.done / g.total) * 100,
100
);

html += `
<div class="goal-card"
${!isViewMode ? `draggable="true"` : ""}
data-id="${g.id}">

<h3>${g.name}</h3>

<p>${g.done} / ${g.total}</p>

${g.deadline ?
`<small>⏳ ${g.deadline}</small>` : ""}

<div class="progress-bar">
<div class="fill"
style="width:${percent}%">
</div>
</div>

<div class="actions">

${!isViewMode ? `

<button onclick="openModal('progress',${i})">
➕ Add
</button>

<button onclick="openModal('set',${i})">
✏️ Edit Progress
</button>

<button onclick="openModal('edit',${i})">
Edit Goal
</button>

<button onclick="deleteGoal('${g.id}')">
Delete
</button>

` : ""}

</div>

</div>
`;

});

goalContainer.innerHTML =
html || "<p>No goals found.</p>";

}

/* ================= DRAG ================= */
function enableDrag(){

let items =
document.querySelectorAll(".goal-card");

let dragItem = null;

items.forEach(item=>{

item.addEventListener("dragstart",()=>{

dragItem = item;
item.style.opacity = "0.5";

});

item.addEventListener("dragend",()=>{

item.style.opacity = "1";

});

item.addEventListener(
"dragover",
e=>e.preventDefault()
);

item.addEventListener(
"drop",
async e=>{

e.preventDefault();

if(dragItem !== item){

let list = item.parentNode;

if(
[...list.children].indexOf(dragItem)
<
[...list.children].indexOf(item)
){
list.insertBefore(
dragItem,
item.nextSibling
);
}else{
list.insertBefore(
dragItem,
item
);
}

let updated = [...list.children];

for(let i=0;i<updated.length;i++){

let id = updated[i].dataset.id;

await updateDoc(
doc(db,"goals",id),
{
order:i
}
);

}

}

});

});

}

/* ================= MODAL ================= */
window.openModal = (mode,index)=>{

if(isViewMode) return;

currentIndex = index;
currentMode = mode;

let g = goals[index];

modal.classList.add("active");

if(mode === "progress"){

modalTitle.innerText = "Add Progress";

modalName.style.display = "none";
modalDate.style.display = "none";
modalInput.value = "";

}

else if(mode === "set"){

modalTitle.innerText =
"Set Progress Value";

modalName.style.display = "none";
modalDate.style.display = "none";
modalInput.value = g.done;

}

else{

modalTitle.innerText = "Edit Goal";

modalName.style.display = "block";
modalDate.style.display = "block";

modalName.value = g.name;
modalInput.value = g.total;
modalDate.value = g.deadline || "";

}

};

window.closeModal = ()=>{
modal.classList.remove("active");
};

/* ================= SAVE ================= */
window.saveModal = async()=>{

if(isViewMode) return;

let g = goals[currentIndex];

if(currentMode === "progress"){

let val = Number(modalInput.value);

if(!val) return;

await updateDoc(
doc(db,"goals",g.id),
{
done:g.done + val
}
);

}

else if(currentMode === "set"){

let val = Number(modalInput.value);

if(val < 0) return;

await updateDoc(
doc(db,"goals",g.id),
{
done:val
}
);

}

else{

await updateDoc(
doc(db,"goals",g.id),
{
name:modalName.value,
total:Number(modalInput.value),
deadline:modalDate.value || null
}
);

}

closeModal();

};

/* ================= DELETE ================= */
window.deleteGoal = async(id)=>{

if(isViewMode) return;

await deleteDoc(
doc(db,"goals",id)
);

};
