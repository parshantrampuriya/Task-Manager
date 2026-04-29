
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
alert("Invalid request");
location.href="friends.html";
return;
}

await loadPage();

});

/* LOAD */
async function loadPage(){

const snap =
await getDoc(doc(db,"friends",friendDocId));

if(!snap.exists()){

alert("Friend record not found");
location.href="friends.html";
return;

}

friendData = snap.data();

/* friend name */
$("friendName").innerText =
"Permission Setup";

/* get current user permission object */
let p =
friendData.permissions?.[uid] || {};

/* fill checks */
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
$(id).checked = !!val;
}

/* SAVE */
window.savePermission = async()=>{

let newPermission = {

home: $("home").checked,
profile: $("profile").checked,
goals: $("goals").checked,
growth: $("growth").checked,

tasks: $("tasks").checked,
insights: $("insights").checked,
mistakes: $("mistakes").checked,
quest: $("quest").checked,
smartmoves: $("smartmoves").checked

};

await updateDoc(
doc(db,"friends",friendDocId),
{
["permissions."+uid]:newPermission
}
);

alert("Saved Successfully ✅");

location.href="friends.html";

};
