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

const getEl=id=>document.getElementById(id);

let currentUser=null;
let viewUid=null;

let editId=null;
let deleteId=null;
let taskQuestId=null;

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
getEl("pageTitle").innerText="👤 Friend Quest";
getEl("addSection").style.display="none";
}else{
getEl("pageTitle").innerText="❓ My Quest";
}

setToday();

await loadFriends();
await loadQuest();

});

/* ================= ADD QUEST ================= */
window.addQuest = async()=>{

try{

const input = getEl("questInput");   // ✅ FIXED
const dateInput = getEl("questDate");
const statusInput = getEl("questStatus");

if(!input || !dateInput) return;

const text = input.value.trim();
const date = dateInput.value;
const status = statusInput?.value || "Pending";

if(!text){
toast("Enter quest");
return;
}

if(!date){
toast("Select date");
return;
}

await addDoc(collection(db,"quest"),{
uid: currentUser.uid,
text,
date,
status,
createdAt: Date.now()
});

/* clear */
input.value="";

toast("Quest Added ✅");

await loadQuest();

}catch(err){
console.error(err);
toast("Error adding quest");
}

};
/* ================= DEFAULT DATE ================= */
function setToday(){

const today=new Date().toISOString().split("T")[0];

if(getEl("questDate")) getEl("questDate").value=today;
if(getEl("taskDate")) getEl("taskDate").value=today;

}

/* ================= FRIENDS ================= */
async function loadFriends(){

const snap=await getDocs(collection(db,"friends"));

let html="";

for(const d of snap.docs){

let users=d.data().users || [];

if(!users.includes(currentUser.uid)) continue;

let fid=users.find(x=>x!==currentUser.uid);

let u=await getDoc(doc(db,"users",fid));

let name="Friend";

if(u.exists()){
name=u.data().name || u.data().email || "Friend";
}

html+=`
<div class="friend-card"
onclick="openFriend('${fid}')">
👤 ${name}
</div>
`;

}

getEl("friendListMini").innerHTML=html || "No friends";

}

window.openFriend=(uid)=>{
location.href="quest.html?uid="+uid+"&t="+Date.now();
};

/* ================= LOAD QUEST ================= */
async function loadQuest(){

const snap=await getDocs(
query(collection(db,"quest"),where("uid","==",viewUid))
);

let arr=[];

snap.forEach(d=>{
arr.push({id:d.id,...d.data()});
});

arr.sort((a,b)=>b.createdAt-a.createdAt);

let html="";
let lastDate="";

let added=0, solved=0, pending=0;

arr.forEach(x=>{

added++;

if(x.status==="Solved") solved++;
else pending++;

if(lastDate!==x.date){
html+=`<div class="date-head">${x.date}</div>`;
lastDate=x.date;
}

html+=`
<div class="quest-card">

<div class="q-left">

<div class="q-text">${x.text}</div>

<div class="tag ${tagClass(x.status)}">${x.status}</div>

</div>

<div class="q-actions">

<button onclick="googleSearch('${escapeText(x.text)}')">🔍</button>
<button onclick="youtubeSearch('${escapeText(x.text)}')">▶️</button>
<button onclick="chatAsk('${escapeText(x.text)}')">🤖</button>
<button onclick="toInsight('${x.id}','${escapeText(x.text)}')">🧠</button>
<button onclick="openTaskPopup('${x.id}','${escapeText(x.text)}')">📋</button>
<button onclick="openEdit('${x.id}','${escapeText(x.text)}','${x.date}','${x.status}')">✏️</button>
<button onclick="openDelete('${x.id}')">🗑️</button>

</div>

</div>
`;

});

getEl("questList").innerHTML=html || "No quest found.";

if(getEl("totalAdded")) getEl("totalAdded").innerText=added;
if(getEl("totalSolved")) getEl("totalSolved").innerText=solved;
if(getEl("totalPending")) getEl("totalPending").innerText=pending;

}

/* ================= TASK POPUP ================= */
window.openTaskPopup=(id,text)=>{

taskQuestId=id;

getEl("taskText").innerText=decodeURIComponent(text);
getEl("taskPopup").classList.add("show");

};

window.closeTaskPopup=()=>{
getEl("taskPopup").classList.remove("show");
};

/* ================= CONFIRM TASK ================= */
window.confirmTask=async()=>{

const date=getEl("taskDate").value;
const time=getEl("taskTime").value || "";

if(!date){
toast("Select date");
return;
}

const qSnap=await getDoc(doc(db,"quest",taskQuestId));
if(!qSnap.exists()) return;

const qData=qSnap.data();

await addDoc(collection(db,"tasks"),{
uid:currentUser.uid,
text:qData.text,
date,
time,
done:false,
fromQuest:true,
questId:taskQuestId,
createdAt:Date.now()
});

closeTaskPopup();
toast("Added To Tasks 📋");

};

/* ================= EDIT ================= */
window.openEdit=(id,text,date,status)=>{

editId=id;

getEl("editText").value=decodeURIComponent(text);
getEl("editDate").value=date;
getEl("editStatus").value=status;

getEl("editPopup").classList.add("show");

};

window.closeEdit=()=>{
getEl("editPopup").classList.remove("show");
};

window.saveEdit=async()=>{

let status=getEl("editStatus").value;
let text=getEl("editText").value.trim();
let date=getEl("editDate").value;

if(status==="Solved"){

await addDoc(collection(db,"insights"),{
uid:currentUser.uid,
text,
date:new Date().toISOString().split("T")[0],
createdAt:Date.now(),
source:"quest-direct"
});

await deleteDoc(doc(db,"quest",editId));

closeEdit();
toast("Solved → Insights 🧠");
loadQuest();
return;
}

await updateDoc(doc(db,"quest",editId),{
text,date,status
});

closeEdit();
toast("Updated ✅");
loadQuest();

};

/* ================= DELETE ================= */
window.openDelete=id=>{
deleteId=id;
getEl("deletePopup").classList.add("show");
};

window.closeDelete=()=>{
getEl("deletePopup").classList.remove("show");
};

window.confirmDelete=async()=>{

await deleteDoc(doc(db,"quest",deleteId));

closeDelete();
toast("Deleted");
loadQuest();

};

/* ================= HELPERS ================= */
function tagClass(v){
return v==="Solved" ? "learned" : "pending";
}

function escapeText(t){
return encodeURIComponent(t);
}

function toast(msg){

let t=getEl("toast");
if(!t) return;

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>t.classList.remove("show"),1800);

}
