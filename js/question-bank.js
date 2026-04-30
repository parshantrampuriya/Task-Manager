import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
onSnapshot,
doc,
getDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= SAFE DOM ================= */
const getEl = (id)=>document.getElementById(id);

const username = getEl("username");
const friendCards = getEl("friendCards");

/* ================= GLOBAL ================= */
let currentUser = null;

/* ================= SIDEBAR ================= */
window.toggleSidebar = ()=>{

const sidebar = getEl("sidebar");

if(sidebar){
sidebar.classList.toggle("active");
}

};

document.addEventListener("click",(e)=>{

const sidebar = getEl("sidebar");
const btn = document.querySelector(".menu-btn");

if(!sidebar || !btn) return;

if(
sidebar.classList.contains("active") &&
!sidebar.contains(e.target) &&
!btn.contains(e.target)
){
sidebar.classList.remove("active");
}

});

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

/* set username safely */
try{
const snap = await getDoc(doc(db,"users",user.uid));

if(snap.exists() && username){
username.innerText =
"📚 Welcome " + (snap.data().name || "User");
}
}catch(e){}

loadFriendBanks();
animateCards();

});

/* ================= ANIMATION ================= */
function animateCards(){

const cards =
document.querySelectorAll(".big-card");

cards.forEach((card,index)=>{

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition="0.5s ease";
card.style.opacity="1";
card.style.transform="translateY(0)";

},180 + (index*130));

});

}

/* ================= PERMISSION CHECK ================= */
async function hasQuestionPermission(friendId){

const snap = await getDocs(collection(db,"friends"));

for(const d of snap.docs){

const data = d.data();
const users = data.users || [];

if(
users.includes(currentUser.uid) &&
users.includes(friendId)
){

const perm =
data.permissions?.[friendId] || {};

/* use insights as question-bank permission */
return perm.insights === true;

}

}

return false;

}

/* ================= BLOCK UI ================= */
function showBlockedCard(name){

return `
<div class="big-card no-friend-card">

<div class="icon">🔒</div>

<h2>${name}</h2>

<p>Access Restricted</p>

</div>
`;

}

/* ================= LOAD FRIEND BANK ================= */
function loadFriendBanks(){

if(!friendCards) return;

onSnapshot(
collection(db,"friends"),

async (snap)=>{

let html = "";

for(const item of snap.docs){

const data = item.data();
const users = data.users || [];

if(!users.includes(currentUser.uid))
continue;

const friendId =
users.find(uid => uid !== currentUser.uid);

if(!friendId) continue;

/* get name */
let friendName = "Friend";

try{
const userSnap =
await getDoc(doc(db,"users",friendId));

if(userSnap.exists()){

const u = userSnap.data();

friendName =
u.name ||
u.username ||
u.email ||
"Friend";

}
}catch(e){}

/* permission check */
const allowed =
await hasQuestionPermission(friendId);

if(!allowed){

html += showBlockedCard(friendName);
continue;

}

/* allowed card */
html += `
<div class="big-card"
onclick="openFriendBank('${friendId}')">

<div class="icon">👤</div>

<h2>${friendName}</h2>

<p>Open ${friendName}'s Question Bank</p>

</div>
`;

}

/* no friends */
if(!html){

html = `
<div class="big-card no-friend-card">

<div class="icon">👥</div>

<h2>No Friends Yet</h2>

<p>Add friends to access their Question Bank</p>

</div>
`;

}

friendCards.innerHTML = html;

animateCards();

});

}

/* ================= OPEN ================= */
window.openFriendBank = (uid)=>{

location.href =
"view-question.html?viewUser=" +
encodeURIComponent(uid);

};
