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

/* GLOBAL */
let currentUser=null;
let tasks=[];
let currentTab="pending";

/* MODAL */
let currentTaskId=null;
let currentAction=null;

/* AUTH */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

let snap=await getDoc(doc(db,"users",user.uid));

if(snap.exists()){
username.innerText=
"👤 Welcome " + (snap.data().name || "");
}

loadTasks();

});

/* DATE */
function getToday(){
return new Date().toLocaleDateString("en-CA");
}

/* LOAD */
function loadTasks(){

onSnapshot(collection(db,"tasks"),snap=>{

tasks=[];

snap.forEach(d=>{

let t=d.data();

if(t.user===currentUser.uid || t.uid===currentUser.uid){
tasks.push({
id:d.id,
...t
});
}

});

render();

});

}

/* ADD */
window.addTask=async()=>{

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

/* STATUS LOGIC */
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

/* SWITCH TAB */
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

/* SORT */
function sortDates(dates){

return dates.sort((a,b)=>{

if(currentTab==="pending"){
return new Date(a)-new Date(b);
}else{
return new Date(b)-new Date(a);
}

});

}

/* RENDER */
function render(){

let today=getToday();

let search=
searchInput.value.toLowerCase();

let filtered=tasks.filter(t=>
(t.text || "")
.toLowerCase()
.includes(search)
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

<button onclick="toggle('${t.id}',${t.completed})">
✔
</button>

<button onclick="openModal(
'edit',
'${t.id}',
'${escapeText(t.text)}',
'${t.date}',
'${t.time || ""}'
)">
✏️
</button>

<button onclick="openModal('delete','${t.id}')">
❌
</button>

</div>

</li>
`;

});

html+=`
</ol>
</div>
`;

});

taskContainer.innerHTML=
html || "<p>No tasks found.</p>";

}

/* MODAL */
window.openModal=(type,id,text="",date="",time="")=>{

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

/* CONFIRM */
window.confirmAction=async()=>{

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

/* TOGGLE */
window.toggle=async(id,c)=>{

const ref=doc(db,"tasks",id);

const snap=await getDoc(ref);

if(!snap.exists()) return;

const task=snap.data();

const nowDone=!c;

/* update completed first */
await updateDoc(ref,{
completed:nowDone
});

/* If linked from quest */
if(task.fromQuest && task.questId){

/* COMPLETE TASK */
if(nowDone){

/* move to insights */
await addDoc(
collection(db,"insights"),
{
uid:currentUser.uid,
text:task.text,
date:getToday(),
createdAt:Date.now(),
source:"task"
}
);

/* remove quest */
await deleteDoc(
doc(db,"quest",task.questId)
);

}

/* UNCHECK TASK */
else{

/* restore quest if missing */
const qRef=
doc(db,"quest",task.questId);

const qSnap=
await getDoc(qRef);

if(!qSnap.exists()){

await addDoc(
collection(db,"quest"),
{
uid:currentUser.uid,
text:task.text,
date:getToday(),
status:"Pending",
createdAt:Date.now()
}
);

}

/* remove latest matching insight */
const insSnap=
await getDocs(
query(
collection(db,"insights"),
where("uid","==",currentUser.uid),
where("text","==",task.text)
)
);

for(const d of insSnap.docs){
await deleteDoc(
doc(db,"insights",d.id)
);
}

}

}

};

/* SEARCH */
searchInput.addEventListener(
"input",
render
);

/* LOGOUT */
logoutBtn.addEventListener(
"click",
async()=>{
await signOut(auth);
location.href="index.html";
}
);

/* HELPERS */
function escapeText(t){
return encodeURIComponent(t || "");
}
