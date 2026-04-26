/* ================= INSIGHTS JS ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
getDocs,
query,
where,
doc,
getDoc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let viewUid=null;

let editId=null;
let deleteId=null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

const params=new URLSearchParams(location.search);
viewUid=params.get("uid") || user.uid;

if(viewUid!==user.uid){

getEl("pageTitle").innerText=
"👤 Friend Insights";

getEl("addSection").style.display="none";

}else{

getEl("pageTitle").innerText=
"🧠 My Insights";

}

setToday();

await loadFriends();
await loadInsights();

});

/* ================= DATE ================= */
function setToday(){

let d=new Date();

if(getEl("insightDate")){
getEl("insightDate").value=
d.toISOString().split("T")[0];
}

}

/* ================= MY PAGE ================= */
window.goMyPage=()=>{
location.href="insights.html";
};

/* ================= ADD ================= */
window.addInsight=async()=>{

let txt=getEl("insightInput").value.trim();
let dt=getEl("insightDate").value;

if(!txt) return toast("Enter insight");
if(!dt) return toast("Select date");

await addDoc(collection(db,"insights"),{
uid:currentUser.uid,
text:txt,
date:dt,
createdAt:Date.now(),
source:"manual"
});

getEl("insightInput").value="";

toast("Saved ✅");

loadInsights();

};

/* ================= FRIENDS ================= */
async function loadFriends(){

const snap=await getDocs(collection(db,"friends"));

let html="";

for(const d of snap.docs){

let users=d.data().users || [];

if(!users.includes(currentUser.uid))
continue;

let fid=users.find(x=>x!==currentUser.uid);

let u=await getDoc(doc(db,"users",fid));

let name="Friend";

if(u.exists()){

name=
u.data().name ||
u.data().email ||
"Friend";

}

html+=`
<div class="friend-card"
onclick="openFriend('${fid}')">
👤 ${name}
</div>
`;

}

getEl("friendListMini").innerHTML=
html || "No friends";

}

window.openFriend=(uid)=>{
location.href=
"insights.html?uid="+uid+"&t="+Date.now();
};

/* ================= LOAD ================= */
async function loadInsights(){

const snap=await getDocs(
query(
collection(db,"insights"),
where("uid","==",viewUid)
)
);

let arr=[];

snap.forEach(d=>{

arr.push({
id:d.id,
...d.data()
});

});

/* latest date first */
arr.sort((a,b)=>{

if(a.date>b.date) return -1;
if(a.date<b.date) return 1;

return Number(b.createdAt||0) -
Number(a.createdAt||0);

});

let html="";
let lastDate="";

/* dashboard */
let total=arr.length;
let manual=0;
let quest=0;
let task=0;

arr.forEach(x=>{

if(x.source==="manual") manual++;
else if(
x.source==="quest" ||
x.source==="quest-direct"
) quest++;
else if(x.source==="task") task++;

if(x.date!==lastDate){

html+=`
<div class="date-head">
${x.date}
</div>
`;

lastDate=x.date;

}

html+=`
<div class="insight-card">

<div class="i-left">

<div class="i-text">
${x.text}
</div>

<div class="i-meta">

${getSourceBadge(x.source)}

</div>

</div>

${
viewUid===currentUser.uid
?
`
<div class="i-actions">

<button class="main-btn"
onclick="openEdit(
'${x.id}',
'${escapeText(x.text)}',
'${x.date}'
)">
Edit</button>

<button class="danger-btn"
onclick="openDelete('${x.id}')">
Delete
</button>

</div>
`
:
""
}

</div>
`;

});

getEl("insightList").innerHTML=
html || "No insights found.";

/* if dashboard boxes exist */
if(getEl("totalInsights"))
getEl("totalInsights").innerText=total;

if(getEl("manualCount"))
getEl("manualCount").innerText=manual;

if(getEl("questCount"))
getEl("questCount").innerText=quest;

if(getEl("taskCount"))
getEl("taskCount").innerText=task;

}

/* ================= SOURCE BADGE ================= */
function getSourceBadge(src){

if(src==="manual")
return `<span class="tag manual">✍ Manual</span>`;

if(src==="quest" || src==="quest-direct")
return `<span class="tag quest">❓ Quest</span>`;

if(src==="task")
return `<span class="tag task">📋 Task</span>`;

return `<span class="tag manual">🧠 Insight</span>`;

}

/* ================= EDIT ================= */
window.openEdit=(id,text,date)=>{

editId=id;

getEl("editText").value=
decodeURIComponent(text);

getEl("editDate").value=date;

getEl("editPopup")
.classList.add("show");

};

window.closeEdit=()=>{

getEl("editPopup")
.classList.remove("show");

};

window.saveEdit=async()=>{

await updateDoc(
doc(db,"insights",editId),
{
text:getEl("editText").value.trim(),
date:getEl("editDate").value
}
);

closeEdit();

toast("Updated ✅");

loadInsights();

};

/* ================= DELETE ================= */
window.openDelete=(id)=>{

deleteId=id;

getEl("deletePopup")
.classList.add("show");

};

window.closeDelete=()=>{

getEl("deletePopup")
.classList.remove("show");

};

window.confirmDelete=async()=>{

await deleteDoc(
doc(db,"insights",deleteId)
);

closeDelete();

toast("Deleted ❌");

loadInsights();

};

/* ================= HELPERS ================= */
function escapeText(t){
return encodeURIComponent(t || "");
}

function toast(msg){

const t=getEl("toast");

if(!t) return;

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
