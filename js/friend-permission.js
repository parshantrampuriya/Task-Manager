/* js/friend-permission.js */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const $ = id => document.getElementById(id);

let uid = null;
let friendDocId = null;
let friendUid = null;
let friendData = null;

/* URL PARAMS */
const params = new URLSearchParams(location.search);

friendDocId = params.get("id");
friendUid = params.get("uid");

/* AUTH */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

uid = user.uid;

if(!friendDocId || !friendUid){
showPopup("Invalid Request","Redirecting...");
setTimeout(()=>{
location.href="friends.html";
},1500);
return;
}

await loadPage();

});

/* LOAD */
async function loadPage(){

const snap =
await getDoc(doc(db,"friends",friendDocId));

if(!snap.exists()){

showPopup("Record Not Found","Returning...");
setTimeout(()=>{
location.href="friends.html";
},1500);

return;
}

friendData = snap.data();

/* title */
$("friendName").innerText =
"Permission Setup";

/* current permission */
let p =
friendData.permissions?.[uid] || {};

/* fill checkboxes */
setCheck("home",p.home);
setCheck("profile",p.profile);
setCheck("goals",p.goals);
setCheck("growth",p.growth);

setCheck("tasks",p.tasks);
setCheck("insights",p.insights);
setCheck("mistakes",p.mistakes);
setCheck("quest",p.quest);
setCheck("smartmoves",p.smartmoves);

}

function setCheck(id,val){

if($(id)){
$(id).checked = !!val;
}

}

/* SAVE */
window.savePermission = async()=>{

let newPermission = {

home:$("home").checked,
profile:$("profile").checked,
goals:$("goals").checked,
growth:$("growth").checked,

tasks:$("tasks").checked,
insights:$("insights").checked,
mistakes:$("mistakes").checked,
quest:$("quest").checked,
smartmoves:$("smartmoves").checked

};

await updateDoc(
doc(db,"friends",friendDocId),
{
["permissions."+uid]:newPermission
}
);

showPopup(
"Saved Successfully ✅",
"Friend access updated"
);

setTimeout(()=>{
location.href="friends.html";
},1600);

};

/* ================= MODERN POPUP ================= */

function showPopup(title,msg){

let old = $("nicePopup");
if(old) old.remove();

const div = document.createElement("div");

div.id = "nicePopup";

div.innerHTML = `

<div style="
position:fixed;
inset:0;
background:rgba(0,0,0,.65);
backdrop-filter:blur(6px);
z-index:9998;
"></div>

<div style="
position:fixed;
top:50%;
left:50%;
transform:translate(-50%,-50%);
width:340px;
max-width:90%;
background:#111827;
border:1px solid rgba(0,255,255,.15);
border-radius:24px;
padding:28px 22px;
text-align:center;
box-shadow:0 0 35px rgba(0,255,255,.18);
z-index:9999;
animation:pop .25s ease;
">

<div style="
font-size:52px;
margin-bottom:12px;
">✅</div>

<h2 style="
margin:0;
font-size:26px;
color:#00eaff;
font-weight:800;
">${title}</h2>

<p style="
margin:12px 0 22px;
font-size:15px;
color:#d1d5db;
line-height:1.5;
">${msg}</p>

<button onclick="closeNicePopup()"
style="
border:none;
padding:12px 28px;
border-radius:14px;
font-weight:700;
font-size:15px;
cursor:pointer;
background:linear-gradient(45deg,#00cfff,#00ffcc);
color:#000;
">
OK
</button>

</div>

<style>
@keyframes pop{
from{
opacity:0;
transform:translate(-50%,-46%) scale(.85);
}
to{
opacity:1;
transform:translate(-50%,-50%) scale(1);
}
}
</style>

`;

document.body.appendChild(div);

}

/* CLOSE */
window.closeNicePopup = ()=>{

let p = $("nicePopup");

if(p) p.remove();

};
