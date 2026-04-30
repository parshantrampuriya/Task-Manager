/* ================= TEST DASHBOARD ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl=(id)=>document.getElementById(id);

let currentUser=null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

animateCards();

await loadUpcoming();
await loadRecent();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{

const sidebar=getEl("sidebar");

if(sidebar){
sidebar.classList.toggle("active");
}

};

/* ================= REFRESH ================= */
window.refreshPage=async()=>{

showToast("Refreshing...");

await loadUpcoming();
await loadRecent();

showToast("Updated ✅");

};

/* ================= CARD ANIMATION ================= */
function animateCards(){

const cards=
document.querySelectorAll(".big-card");

cards.forEach((card,index)=>{

card.style.opacity="0";
card.style.transform="translateY(25px)";

setTimeout(()=>{

card.style.transition="0.45s ease";
card.style.opacity="1";
card.style.transform="translateY(0)";

},150+(index*110));

});

}

/* ================= STATUS ================= */
function getStatus(test){

const now=Date.now();

const assigned=
test.assignedTo || [];

const attempted=
test.attemptedUsers || [];

if(!assigned.includes(currentUser.uid))
return "hidden";

if(attempted.includes(currentUser.uid))
return "attempted";

const start=
Number(test.startAt || 0);

const end=
Number(test.endAt || 0);

if(start && now<start)
return "upcoming";

if(end && now>end)
return "expired";

return "available";

}

/* ================= DATE ================= */
function fDate(ms){

if(!ms) return "Anytime";

return new Date(ms)
.toLocaleString();

}

/* ================= UPCOMING ================= */
async function loadUpcoming(){

const box=getEl("upcomingList");
const count=getEl("upcomingCount");

if(!box || !count) return;

try{

const snap=
await getDocs(collection(db,"tests"));

let arr=[];

snap.forEach(doc=>{

arr.push({
id:doc.id,
...doc.data()
});

});

arr=arr.filter(x=>{

const s=getStatus(x);

return (
s==="upcoming" ||
s==="available"
);

});

/* nearest first */
arr.sort((a,b)=>{

const a1=
Number(a.startAt || 0);

const b1=
Number(b.startAt || 0);

return a1-b1;

});

let html="";
let total=0;

arr.slice(0,5).forEach(test=>{

const status=
getStatus(test);

html += `
<div class="list-row">

<div>

<strong>
${test.testName || "Untitled Test"}
</strong>

<small>
${test.duration || 0} min •
${status==="upcoming"
? fDate(test.startAt)
: "Live Now"}
</small>

</div>

<button class="mini-btn"
onclick="location.href='give-test.html'">

${status==="upcoming"
? "View"
: "Start"}

</button>

</div>
`;

total++;

});

count.innerText=total;

box.innerHTML=
html || `
<div class="empty-row">
No upcoming tests
</div>
`;

}catch(error){

count.innerText="0";

box.innerHTML=`
<div class="empty-row">
No upcoming tests
</div>
`;

}

}

/* ================= RECENT ================= */
async function loadRecent(){

const box=getEl("recentList");

if(!box) return;

try{

const snap=
await getDocs(collection(db,"results"));

let arr=[];

snap.forEach(doc=>{

const d=doc.data();

if(d.uid===currentUser.uid){

arr.push({
id:doc.id,
...d
});

}

});

/* latest first */
arr.sort((a,b)=>
Number(b.submittedAt||0)-
Number(a.submittedAt||0)
);

let html="";

arr.slice(0,5).forEach(r=>{

html += `
<div class="list-row">

<div>

<strong>
${r.testName || "Test"}
</strong>

<small>
Score:
${r.score ?? 0}
</small>

</div>

<button class="mini-btn"
onclick="location.href='result.html?id=${r.testId}'">
View
</button>

</div>
`;

});

box.innerHTML=
html || `
<div class="empty-row">
No recent activity
</div>
`;

}catch(error){

box.innerHTML=`
<div class="empty-row">
No recent activity
</div>
`;

}

}

/* ================= TOAST ================= */
function showToast(msg){

const toast=getEl("toast");

if(!toast) return;

toast.innerText=msg;
toast.className="show";

setTimeout(()=>{
toast.className="";
},2000);

}
