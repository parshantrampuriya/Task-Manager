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
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser;

const getEl=id=>document.getElementById(id);

/* AUTH */
onAuthStateChanged(auth,(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

loadReceived();
loadSent();
loadFriends();

});

/* DEFAULT PERMISSION */
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

/* SEND REQUEST SAME */
window.sendRequest = async()=>{

let email=getEl("searchUser").value.trim();

if(!email) return showToast("Enter email");

let snap=await getDocs(
query(collection(db,"users"),
where("email","==",email))
);

if(snap.empty) return showToast("User not found");

let target=snap.docs[0];

if(target.id===currentUser.uid)
return showToast("Cannot add yourself");

await addDoc(collection(db,"friendRequests"),{
from:currentUser.uid,
to:target.id,
status:"pending"
});

showToast("Request sent");
};

/* ACCEPT UPDATED */
window.accept = async(id,fromUser)=>{

await updateDoc(doc(db,"friendRequests",id),{
status:"accepted"
});

await addDoc(collection(db,"friends"),{

users:[currentUser.uid,fromUser],

permissions:{
[currentUser.uid]:defaultPermission(),
[fromUser]:defaultPermission()
}

});

showToast("Friend Added 🎉");

};

/* LOAD FRIENDS UPDATED */
function loadFriends(){

onSnapshot(collection(db,"friends"),async snap=>{

let html="";

for(let f of snap.docs){

let d=f.data();
let users=d.users||[];

if(!users.includes(currentUser.uid))
continue;

let friendId=
users.find(x=>x!==currentUser.uid);

let userSnap=await getDocs(
query(collection(db,"users"),
where("__name__","==",friendId))
);

let name=
userSnap.docs[0]?.data()?.name || "User";

html+=`

<div class="friend">

<span class="friend-name"
onclick="openFriend('${friendId}')">
👤 ${name}
</span>

<div class="friend-actions">

<button onclick="openChat('${friendId}')">
💬 Chat
</button>

<button onclick="openFriend('${friendId}')">
👁 View
</button>

<button onclick="openPermission('${f.id}','${friendId}')">
⚙
</button>

<button class="remove"
onclick="removeFriend('${f.id}')">
❌
</button>

</div>

</div>

`;

}

getEl("friendList").innerHTML=
html || "No friends";

});

}

/* OPEN PERMISSION */
window.openPermission=(docId,friendId)=>{

location.href=
"friend-permission.html?id="+docId+"&uid="+friendId;

};

/* VIEW */
window.openFriend=(id)=>{
location.href="home.html?viewUser="+id;
};

window.openChat=(id)=>{
location.href="chat.html?uid="+id;
};

/* REMOVE */
window.removeFriend=async(id)=>{

await deleteDoc(doc(db,"friends",id));
showToast("Removed");

};

/* TOAST */
window.showToast=(msg)=>{

let t=getEl("toast");
t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},2000);

};
