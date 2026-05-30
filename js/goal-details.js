import { db } from "./firebase.js";

import {
collection,
addDoc,
onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* GET GOAL ID */

const params =
new URLSearchParams(
window.location.search
);

const goalId =
params.get("id");

/* SHOW GOAL NAME */

document.getElementById(
"goalName"
).innerText =
"Goal ID: " + goalId;

/* ADD MILESTONE */

window.addMilestone =
async()=>{

const name =
document.getElementById(
"milestoneName"
).value.trim();

if(!name){

alert("Enter milestone");
return;

}

await addDoc(

collection(
db,
"goalMilestones"
),

{

goalId:goalId,

name:name,

completed:false,

createdAt:Date.now()

}

);

document.getElementById(
"milestoneName"
).value="";

};

/* LOAD MILESTONES */

function loadMilestones(){

onSnapshot(

collection(
db,
"goalMilestones"
),

(snapshot)=>{

let html="";

snapshot.forEach(docu=>{

const m =
docu.data();

if(
m.goalId !== goalId
) return;

html += `

<div class="card">

<h3>
${m.name}
</h3>

<p>
${m.completed ? "✅ Done" : "⏳ Pending"}
</p>

</div>

`;

});

document.getElementById(
"milestoneContainer"
).innerHTML = html;

}

);

}

loadMilestones();