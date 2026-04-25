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
orderBy,
doc,
updateDoc,
deleteDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let viewUid=null;

let editId=null;

/* AUTH */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

const params=new URLSearchParams(location.search);
viewUid=params.get("uid") || user.uid;

loadFriendsMini();
loadMistakes();

});

/* SIDEBAR */
window.toggleSidebar=()=>{

getEl("sidebar").classList.toggle("active");

};

/* ADD */
window.addMistake=async()=>{

let txt=getEl("mistakeInput").value.trim();

if(!txt) return showToast("Enter mistake");

await addDoc(collection(db,"mistakes"),{

uid:viewUid===currentUser.uid
? currentUser.uid
: currentUser.uid,

text:txt,
createdAt:Date.now()

});

getEl("mistakeInput").value="";
showToast("Added ✅");

loadMistakes();

};

/* LOAD FRIENDS */
async function loadFriendsMini(){

const snap=await getDocs(collection(db,"friends"));

let html="";

for(const f of snap.docs){

const users=f.data().users || [];

if(!users.includes(currentUser.uid))
continue;

const fid=users.find(x=>x!==currentUser.uid);

const u=await getDoc(doc(db,"users",fid));

let name="Friend";

if(u.exists()){

name=
u.data().name ||
u.data().email ||
"Friend";

}

html+=`
<div class="friend-mini"
onclick="openFriend('${fid}')">
👤 ${name}
</div>
`;

}

getEl("friendListMini").innerHTML=
html || "No Friends";

}

/* OPEN FRIEND */
window.openFriend=(uid)=>{

location.href=
"mistakes.html?uid="+uid;

};

/* LOAD MISTAKES */
async function loadMistakes(){

let q=query(
collection(db,"mistakes"),
where("uid","==",viewUid),
orderBy("createdAt","desc")
);

const snap=await getDocs(q);

let html="";
let lastDate="";

for(const d of snap.docs){

const x=d.data();

let dt=new Date(x.createdAt);

let dateTxt=
dt.toLocaleDateString();

if(dateTxt!==lastDate){

html+=`
<div class="date-head">
${dateTxt}
</div>
`;

lastDate=dateTxt;
}

html+=`
<div class="mistake-card">

<div class="mistake-top">

<div class="mistake-text">
${x.text}
</div>

</div>

<div class="mistake-time">
${dt.toLocaleTimeString()}
</div>

${
viewUid===currentUser.uid
?
`
<div class="m-actions">

<button onclick="editMistake('${d.id}','${x.text}')">
✏ Edit
</button>

<button onclick="deleteMistake('${d.id}')">
🗑 Delete
</button>

</div>
`
:""
}

</div>
`;

}

getEl("mistakeList").innerHTML=
html || "No mistakes found.";

if(viewUid===currentUser.uid){

getEl("pageTitle").innerText=
"❌ My Mistakes";

}else{

getEl("pageTitle").innerText=
"👤 Friend Mistakes";

}

}

/* EDIT */
window.editMistake=(id,text)=>{

editId=id;

getEl("editInput").value=text;

getEl("editModal")
.classList.add("active");

};

window.closeEdit=()=>{

getEl("editModal")
.classList.remove("active");

};

window.saveEdit=async()=>{

let val=
getEl("editInput").value.trim();

if(!val) return;

await updateDoc(
doc(db,"mistakes",editId),
{
text:val
}
);

closeEdit();
showToast("Updated ✅");
loadMistakes();

};

/* DELETE */
window.deleteMistake=async(id)=>{

await deleteDoc(
doc(db,"mistakes",id)
);

showToast("Deleted ❌");
loadMistakes();

};

/* TOAST */
function showToast(msg){

let t=getEl("toast");

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
