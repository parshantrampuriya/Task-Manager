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
const getEl = id => document.getElementById(id);

const username = getEl("username");
const testContainer = getEl("testContainer");

/* ================= VIEW MODE ================= */
const params = new URLSearchParams(location.search);
const viewUser = params.get("viewUser");

let currentUser = null;
let uid = null;
let realUid = null;
let isViewMode = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;
realUid = user.uid;

/* view mode logic */
if(viewUser){
uid = viewUser;
isViewMode = true;
}else{
uid = realUid;
}

/* username */
try{
const snap = await getDoc(doc(db,"users",uid));

if(snap.exists() && username){

const name = snap.data().name || "User";

if(isViewMode){
username.innerText = "👀 Viewing " + name;

/* permission check */
const allowed = await checkPermission();

if(!allowed){
showBlockedPage(name);
return;
}

}else{
username.innerText = "🧪 Welcome " + name;
}

}
}catch(e){}

/* load tests */
loadTests();

});

/* ================= PERMISSION ================= */
async function checkPermission(){

const snap = await getDocs(collection(db,"friends"));

for(const d of snap.docs){

const data = d.data();
const users = data.users || [];

if(
users.includes(realUid) &&
users.includes(uid)
){

const perm =
data.permissions?.[uid] || {};

/* using insights or create "tests" permission */
return perm.tests === true || perm.insights === true;

}

}

return false;

}

/* ================= BLOCK PAGE ================= */
function showBlockedPage(name){

if(!testContainer) return;

testContainer.innerHTML = `
<div style="
padding:60px 30px;
text-align:center;
background:#111827;
border-radius:18px;
box-shadow:0 0 25px rgba(0,255,255,.15);
">

<div style="font-size:60px;">🔒</div>

<h2 style="margin-top:15px;">
${name} blocked this page
</h2>

<p style="opacity:.8;margin-top:10px;">
Your friend has restricted access.
</p>

<button onclick="location.href='home.html'"
style="
margin-top:25px;
padding:14px 24px;
border:none;
border-radius:14px;
font-weight:700;
cursor:pointer;
background:linear-gradient(45deg,#00eaff,#00ff9d);
">
↩ My Dashboard
</button>

</div>
`;

}

/* ================= LOAD TESTS ================= */
function loadTests(){

onSnapshot(collection(db,"tests"), snap=>{

let html = "";

snap.forEach(d=>{

const t = d.data();

/* filter by user */
if(t.user !== uid) return;

html += `
<div class="test-card">

<h3>${t.title || "Test"}</h3>

<p>${t.description || ""}</p>

${t.score !== undefined ?
`<small>Score: ${t.score}</small>` : ""}

</div>
`;

});

if(testContainer){
testContainer.innerHTML =
html || "<p>No tests available.</p>";
}

});

}
