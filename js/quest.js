// ================= quest.js =================

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

/* AUTH */
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

/* DATE */
function setToday(){
getEl("questDate").value=
new Date().toISOString().split("T")[0];
}

/* PAGE */
window.goMyPage=()=>{
location.href="quest.html";
};

/* ADD */
window.addQuest=async()=>{

let text=getEl("questInput").value.trim();
let date=getEl("questDate").value;
let priority=getEl("questPriority").value;

if(!text) return toast("Enter quest");

await addDoc(collection(db,"quest"),{
uid:currentUser.uid,
text,
date,
priority,
createdAt:Date.now()
});

getEl("questInput").value="";
toast("Saved ✅");
loadQuest();

};

/* FRIENDS */
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
name=u.data().name || u.data().email;
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
location.href="quest.html?uid="+uid;
};

/* LOAD */
async function loadQuest(){

const snap=await getDocs(
query(collection(db,"quest"),
where("uid","==",viewUid))
);

let arr=[];

snap.forEach(d=>{
arr.push({id:d.id,...d.data()});
});

arr.sort((a,b)=>a.date>b.date?-1:1);

let html="";
let last="";

arr.forEach(x=>{

if(x.date!==last){

html+=`
<div class="date-head">${x.date}</div>
`;

last=x.date;
}

let p=(x.priority || "Medium").toLowerCase();

html+=`
<div class="quest-card">

<div class="q-left">

<div class="q-text">
${x.text}
</div>

<div class="q-meta">
Priority:
<span class="priority ${p}">
${x.priority || "Medium"}
</span>
</div>

</div>

${
viewUid===currentUser.uid
?
`
<div class="q-actions">

<button class="main-btn"
onclick="openEdit('${x.id}','${encodeURIComponent(x.text)}','${x.date}','${x.priority}')">
Edit
</button>

<button class="danger-btn"
onclick="openDelete('${x.id}')">
Delete
</button>

</div>
`
:""
}

</div>
`;

});

getEl("questList").innerHTML=
html || "No quest found.";

}

/* EDIT */
window.openEdit=(id,text,date,p)=>{

editId=id;

getEl("editText").value=
decodeURIComponent(text);

getEl("editDate").value=date;
getEl("editPriority").value=p;

getEl("editPopup").classList.add("show");

};

window.closeEdit=()=>{
getEl("editPopup").classList.remove("show");
};

window.saveEdit=async()=>{

await updateDoc(
doc(db,"quest",editId),
{
text:getEl("editText").value.trim(),
date:getEl("editDate").value,
priority:getEl("editPriority").value
}
);

closeEdit();
toast("Updated ✅");
loadQuest();

};

/* DELETE */
window.openDelete=(id)=>{
deleteId=id;
getEl("deletePopup").classList.add("show");
};

window.closeDelete=()=>{
getEl("deletePopup").classList.remove("show");
};

window.confirmDelete=async()=>{

await deleteDoc(doc(db,"quest",deleteId));

closeDelete();
toast("Deleted ❌");
loadQuest();

};

/* TOAST */
function toast(msg){

const t=getEl("toast");

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
