/* ================= SMART MOVES JS ================= */

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

/* auth */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

const params=new URLSearchParams(location.search);
viewUid=params.get("uid") || user.uid;

if(viewUid!==user.uid){
getEl("pageTitle").innerText="👤 Friend Smart Moves";
getEl("addSection").style.display="none";
}else{
getEl("pageTitle").innerText="🚀 My Smart Moves";
}

setToday();
await loadFriends();
await loadMoves();

});

/* date */
function setToday(){
let d=new Date();
getEl("moveDate").value=
d.toISOString().split("T")[0];
}

/* my page */
window.goMyPage=()=>{
location.href="smart-moves.html";
};

/* add */
window.addMove=async()=>{

let txt=getEl("moveInput").value.trim();
let dt=getEl("moveDate").value;

if(!txt) return toast("Enter smart move");
if(!dt) return toast("Select date");

await addDoc(collection(db,"smartMoves"),{
uid:currentUser.uid,
text:txt,
date:dt,
createdAt:Date.now()
});

getEl("moveInput").value="";
toast("Saved ✅");
loadMoves();

};

/* friends */
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
name=u.data().name ||
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
"smart-moves.html?uid="+uid+"&t="+Date.now();
};

/* load */
async function loadMoves(){

const snap=await getDocs(
query(
collection(db,"smartMoves"),
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

arr.sort((a,b)=>{

if(a.date>b.date) return -1;
if(a.date<b.date) return 1;

return b.createdAt-a.createdAt;

});

let html="";
let lastDate="";

arr.forEach(x=>{

if(x.date!==lastDate){

html+=`
<div class="date-head">${x.date}</div>
`;

lastDate=x.date;
}

html+=`
<div class="move-card">

<div class="s-left">
<div class="s-text">${x.text}</div>
</div>

${
viewUid===currentUser.uid
?
`
<div class="s-actions">

<button class="main-btn"
onclick="openEdit('${x.id}','${escapeText(x.text)}','${x.date}')">
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

getEl("moveList").innerHTML=
html || "No smart moves found.";

}

/* edit */
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
doc(db,"smartMoves",editId),
{
text:getEl("editText").value.trim(),
date:getEl("editDate").value
}
);

closeEdit();
toast("Updated ✅");
loadMoves();

};

/* delete */
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
doc(db,"smartMoves",deleteId)
);

closeDelete();
toast("Deleted ❌");
loadMoves();

};

function escapeText(t){
return encodeURIComponent(t);
}

function toast(msg){

const t=getEl("toast");

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
