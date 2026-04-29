import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
collection,
addDoc,
onSnapshot,
updateDoc,
deleteDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */
let currentUser=null;
let tasks=[];
let currentTab="pending";

let currentTaskId=null;
let currentAction=null;

/* FRIEND VIEW MODE */
const params = new URLSearchParams(location.search);
const viewUser = params.get("viewUser");

let viewUid = null;
let isViewMode = false;
let friendPermission = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

if(viewUser){
viewUid=viewUser;
isViewMode=true;
}else{
viewUid=user.uid;
}

/* load user name */
let snap=await getDoc(doc(db,"users",viewUid));

if(snap.exists()){

const name = snap.data().name || "";

if(isViewMode){

username.innerText =
"👀 Viewing " + name;

/* permission check */
const allowed =
await checkFriendPermission();

if(!allowed){
showBlockedPage(name);
return;
}

/* hide add inputs */
hideEditArea();

}else{

username.innerText =
"👤 Welcome " + name;

}

}

loadTasks();

});

/* ================= PERMISSION ================= */
async function checkFriendPermission(){

const snap =
await getDocs(collection(db,"friends"));

for(const d of snap.docs){

const data=d.data();
const users=data.users || [];

if(
users.includes(currentUser.uid) &&
users.includes(viewUid)
){

friendPermission =
data.permissions?.[viewUid] || {};

return friendPermission.tasks === true;

}

}

return false;

}

/* ================= BLOCKED ================= */
function showBlockedPage(name){

taskContainer.innerHTML = `
<div style="
padding:60px 30px;
text-align:center;
background:#111827;
border-radius:18px;
box-shadow:0 0 25px rgba(0,255,255,.15);
">

<div style="font-size:58px;">🔒</div>

<h2 style="margin-top:15px;">
${name} blocked Tasks page
</h2>

<p style="opacity:.8;margin-top:10px;">
You don't have access.
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

/* ================= HIDE EDIT AREA ================= */
function hideEditArea(){

if(taskInput) taskInput.style.display="none";
if(dateInput) dateInput.style.display="none";
if(timeInput) timeInput.style.display="none";

const addBtn =
document.querySelector("[onclick='addTask()']");

if(addBtn) addBtn.style.display="none";

}

/* ================= DATE ================= */
function getToday(){
return new Date().toLocaleDateString("en-CA");
}

/* ================= LOAD ================= */
function loadTasks(){

onSnapshot(collection(db,"tasks"),snap=>{

tasks=[];

snap.forEach(d=>{

let t=d.data();

if(
t.user===viewUid ||
t.uid===viewUid
){
tasks.push({
id:d.id,
...t
});
}

});

render();

});

}

/* ================= ADD ================= */
window.addTask=async()=>{

if(isViewMode) return;

let text=taskInput.value.trim();
let date=dateInput.value;
let time=timeInput.value;

if(!text) return;

await addDoc(collection(db,"tasks"),{

text:text,
date:date || getToday(),
time:time || "00:00",
completed:false,
user:currentUser.uid,
uid:currentUser.uid,
createdAt:Date.now()

});

taskInput.value="";
dateInput.value="";
timeInput.value="";

};

/* ================= STATUS ================= */
function getStatus(t){

if(!t.time || t.time==="00:00")
return "normal";

let now=new Date();

let taskTime=
new Date(`${t.date}T${t.time}`);

let diff=taskTime-now;

if(diff<0) return "overdue";
if(diff<30*60000) return "urgent";
if(diff<60*60000) return "soon";

return "normal";

}

/* ================= TAB ================= */
window.switchTab=(tab,e)=>{

currentTab=tab;

document
.querySelectorAll(".tabs button")
.forEach(btn=>{
btn.classList.remove("active");
});

if(e) e.target.classList.add("active");

render();

};

/* ================= SORT ================= */
function sortDates(dates){

return dates.sort((a,b)=>{

if(currentTab==="pending"){
return new Date(a)-new Date(b);
}else{
return new Date(b)-new Date(a);
}

});

}

/* ================= RENDER ================= */
function render(){

let today=getToday();

let search=
searchInput.value.toLowerCase();

let filtered=tasks.filter(t=>
(t.text || "")
.toLowerCase()
includes(search)
);

if(currentTab==="pending"){
filtered=filtered.filter(t=>
!t.completed &&
t.date>=today
);
}

if(currentTab==="due"){
filtered=filtered.filter(t=>
!t.completed &&
t.date<today
);
}

if(currentTab==="completed"){
filtered=filtered.filter(t=>
t.completed
);
}

let grouped={};

filtered.forEach(t=>{

if(!grouped[t.date])
grouped[t.date]=[];

grouped[t.date].push(t);

});

let html="";

let dates=
sortDates(Object.keys(grouped));

dates.forEach(date=>{

let dayName=
new Date(date)
.toLocaleDateString("en-US",{
weekday:"long"
});

html+=`
<div class="date-group">

<h3>
📅 ${dayName} (${date})
</h3>

<ol class="task-list">
`;

grouped[date].sort((a,b)=>{

if(a.completed!==b.completed){
return a.completed ? 1 : -1;
}

return (a.time || "")
.localeCompare(b.time || "");

});

grouped[date].forEach(t=>{

let status=getStatus(t);

html+=`
<li class="task-item ${t.completed?'done':''} ${status}">

<div style="
display:flex;
align-items:center;
gap:10px;
flex:1;
">

<span>${t.text}</span>

${
t.time && t.time!=="00:00"
?
`<small>🕒 ${t.time}</small>`
:
""
}

${
t.fromQuest
?
`<small style="color:#00cfff;">📘 Quest</small>`
:
""
}

</div>

<div class="task-actions">

${!isViewMode ? `
<button onclick="toggle('${t.id}',${t.completed})">✔</button>

<button onclick="openModal(
'edit',
'${t.id}',
'${escapeText(t.text)}',
'${t.date}',
'${t.time || ""}'
)">✏️</button>

<button onclick="openModal('delete','${t.id}')">❌</button>
` : ""}

</div>

</li>
`;

});

html+=`
</ol>
</div>
`;

});

taskContainer.innerHTML =
html || "<p>No tasks found.</p>";

}

/* ================= MODAL ================= */
window.openModal=(type,id,text="",date="",time="")=>{

if(isViewMode) return;

currentTaskId=id;
currentAction=type;

modal.classList.add("active");

modalInput.style.display="block";
modalDate.style.display="block";
modalTime.style.display="block";

if(type==="edit"){

modalTitle.innerText="Edit Task";

modalInput.value=
decodeURIComponent(text);

modalDate.value=date;
modalTime.value=time;

}

if(type==="delete"){

modalTitle.innerText=
"Delete this task?";

modalInput.style.display="none";
modalDate.style.display="none";
modalTime.style.display="none";

}

};

window.closeModal=()=>{
modal.classList.remove("active");
};

/* ================= CONFIRM ================= */
window.confirmAction=async()=>{

if(isViewMode) return;

if(currentAction==="edit"){

await updateDoc(
doc(db,"tasks",currentTaskId),
{
text:modalInput.value.trim(),
date:modalDate.value,
time:modalTime.value || "00:00"
}
);

}

if(currentAction==="delete"){

await deleteDoc(
doc(db,"tasks",currentTaskId)
);

}

closeModal();

};

/* ================= TOGGLE ================= */
window.toggle=async(id,c)=>{

if(isViewMode) return;

/* existing toggle kept same */
const ref=doc(db,"tasks",id);
const snap=await getDoc(ref);
if(!snap.exists()) return;

await updateDoc(ref,{
completed:!c
});

};

/* ================= SEARCH ================= */
searchInput.addEventListener(
"input",
render
);

/* ================= LOGOUT ================= */
logoutBtn.addEventListener(
"click",
async()=>{
await signOut(auth);
location.href="index.html";
}
);

/* ================= HELPERS ================= */
function escapeText(t){
return encodeURIComponent(t || "");
}
