import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
query,
where,
getDocs,
onSnapshot,
updateDoc,
doc,
deleteDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= SAFE DOM ================= */
const getEl = id => document.getElementById(id);

const username     = getEl("username");
const requestList  = getEl("requestList");
const sentList     = getEl("sentList");
const friendList   = getEl("friendList");
const toast        = getEl("toast");
const searchUser   = getEl("searchUser");

/* ================= GLOBAL ================= */
let currentUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href = "index.html";
return;
}

currentUser = user;

/* username */
try{

const snap =
await getDoc(doc(db,"users",user.uid));

if(snap.exists() && username){

username.innerText =
"👥 Welcome " +
(snap.data().name || "User");

}

}catch(e){}

loadReceived();
loadSent();
loadFriends();

});

/* ================= DEFAULT PERMISSION ================= */
function defaultPermission(){

return{
home:true,
profile:true,
goals:true,
growth:true,
tasks:false,
insights:false,
mistakes:false,
quest:false,
smartmoves:false
};

}

/* ================= SEND REQUEST ================= */
window.sendRequest = async()=>{

let email = searchUser?.value.trim();

if(!email) return showToast("Enter email");

let snap = await getDocs(
query(
collection(db,"users"),
where("email","==",email)
)
);

if(snap.empty)
return showToast("User not found");

let target = snap.docs[0];

if(target.id === currentUser.uid)
return showToast("Cannot add yourself");

/* already request check */
let oldReq = await getDocs(
query(
collection(db,"friendRequests"),
where("from","==",currentUser.uid),
where("to","==",target.id),
where("status","==","pending")
)
);

if(!oldReq.empty)
return showToast("Already sent");

await addDoc(
collection(db,"friendRequests"),
{
from:currentUser.uid,
to:target.id,
status:"pending",
createdAt:Date.now()
}
);

showToast("Request sent");

if(searchUser) searchUser.value="";

};

/* ================= RECEIVED ================= */
function loadReceived(){

onSnapshot(
query(
collection(db,"friendRequests"),
where("to","==",currentUser.uid),
where("status","==","pending")
),
async snap=>{

if(!requestList) return;

let html="";

for(const r of snap.docs){

let d = r.data();

let userSnap =
await getDoc(doc(db,"users",d.from));

let name =
userSnap.exists()
? userSnap.data().name
: "User";

html += `
<div class="friend">

<span>👤 ${name}</span>

<div class="friend-actions">

<button onclick="accept('${r.id}','${d.from}')">✔</button>

<button onclick="rejectReq('${r.id}')">❌</button>

</div>

</div>
`;

}

requestList.innerHTML =
html || "No requests";

});

}

/* ================= SENT ================= */
function loadSent(){

onSnapshot(
query(
collection(db,"friendRequests"),
where("from","==",currentUser.uid),
where("status","==","pending")
),
async snap=>{

if(!sentList) return;

let html="";

for(const r of snap.docs){

let d = r.data();

let userSnap =
await getDoc(doc(db,"users",d.to));

let name =
userSnap.exists()
? userSnap.data().name
: "User";

html += `
<div class="friend">
⏳ ${name}
</div>
`;

}

sentList.innerHTML =
html || "No sent";

});

}

/* ================= ACCEPT ================= */
window.accept = async(id,fromUser)=>{

await updateDoc(
doc(db,"friendRequests",id),
{
status:"accepted"
}
);

await addDoc(
collection(db,"friends"),
{
users:[
currentUser.uid,
fromUser
],

permissions:{
[currentUser.uid]:
defaultPermission(),

[fromUser]:
defaultPermission()
},

createdAt:Date.now()
}
);

showToast("Friend Added");

};

/* ================= REJECT ================= */
window.rejectReq = async(id)=>{

await updateDoc(
doc(db,"friendRequests",id),
{
status:"rejected"
}
);

showToast("Rejected");

};

/* ================= LOAD FRIENDS ================= */
function loadFriends(){

onSnapshot(
collection(db,"friends"),
async snap=>{

if(!friendList) return;

let html="";

for(const f of snap.docs){

let d = f.data();

let users = d.users || [];

if(!users.includes(currentUser.uid))
continue;

let friendId =
users.find(x=>x!==currentUser.uid);

let userSnap =
await getDoc(doc(db,"users",friendId));

let name =
userSnap.exists()
? userSnap.data().name
: "User";

html += `
<div class="friend">

<span class="friend-name">
👤 ${name}
</span>

<div class="friend-actions">

<button onclick="openChat('${friendId}')">
💬
</button>

<button onclick="openFriend('${friendId}')">
👁
</button>

<button onclick="openPermission('${f.id}','${friendId}')">
⚙
</button>

<button onclick="removeFriend('${f.id}')">
❌
</button>

</div>

</div>
`;

}

friendList.innerHTML =
html || "No friends";

});

}

/* ================= NAVIGATION ================= */
window.openFriend = (id)=>{

location.href =
"home.html?viewUser=" + id;

};

window.openChat = (id)=>{

location.href =
"chat.html?uid=" + id;

};

window.openPermission = (docId,uid)=>{

location.href =
"friend-permission.html?id=" +
docId +
"&uid=" +
uid;

};

/* ================= REMOVE ================= */
window.removeFriend = async(id)=>{

await deleteDoc(
doc(db,"friends",id)
);

showToast("Removed");

};

/* ================= TOAST ================= */
window.showToast = (msg)=>{

if(!toast){
alert(msg);
return;
}

toast.innerText = msg;
toast.classList.add("show");

setTimeout(()=>{
toast.classList.remove("show");
},2000);

};
