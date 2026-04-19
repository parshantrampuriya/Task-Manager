// js/analytics.js

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allResults=[];

/* auth */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
await loadResults();

});

/* load results */
async function loadResults(){

const snap=
await getDocs(collection(db,"results"));

allResults=[];

snap.forEach(doc=>{

const d=doc.data();

if(d.uid===currentUser.uid){

allResults.push({
id:doc.id,
...d
});

}

});

allResults.sort((a,b)=>
(a.submittedAt||0)-
(b.submittedAt||0)
);

renderSummary();
renderCharts();

}

/* summary */
function renderSummary(){

const total=
allResults.length;

let sum=0;
let highest=0;
let passed=0;

let bestTest="-";
let lowTest="-";

let bestVal=-99999;
let lowVal=99999;

allResults.forEach(r=>{

const score=
Number(r.score||0);

const totalMarks=
Number(r.totalMarks||0);

sum += score;

if(score>highest)
highest=score;

if(score>=Number(r.passMarks||0))
passed++;

if(score>bestVal){
bestVal=score;
bestTest=
r.testName ||
"Untitled Test";
}

if(score<lowVal){
lowVal=score;
lowTest=
r.testName ||
"Untitled Test";
}

});

const avg=
total>0
? (sum/total).toFixed(1)
: 0;

const passRate=
total>0
? ((passed/total)*100).toFixed(1)
: 0;

/* accuracy */
let correct=0;
let wrong=0;

allResults.forEach(r=>{
correct += Number(r.correct||0);
wrong += Number(r.wrong||0);
});

const acc=
(correct+wrong)>0
? ((correct/(correct+wrong))*100).toFixed(1)
: 0;

/* improvement */
let improve=0;

if(total>=2){

const first=
Number(allResults[0].score||0);

const last=
Number(
allResults[total-1].score||0
);

if(first!==0){

improve=
(((last-first)/Math.abs(first))*100)
.toFixed(1);

}else{
improve=last*100;
}

}

getEl("totalTests").innerText=
total;

getEl("avgScore").innerText=
avg;

getEl("highScore").innerText=
highest;

getEl("passRate").innerText=
passRate + "%";

getEl("bestTest").innerText=
bestTest;

getEl("lowTest").innerText=
lowTest;

getEl("accuracy").innerText=
acc + "%";

getEl("improve").innerText=
improve + "%";

}

/* charts */
function renderCharts(){

/* line chart */
const labels=[];
const scores=[];

allResults.forEach((r,i)=>{

labels.push(
r.testName ||
("Test "+(i+1))
);

scores.push(
Number(r.score||0)
);

});

new Chart(
document.getElementById("scoreChart"),
{
type:"line",
data:{
labels,
datasets:[{
label:"Score",
data:scores,
borderColor:"#00ffff",
backgroundColor:"rgba(0,255,255,.15)",
fill:true,
tension:.35
}]
},
options:{
responsive:true,
plugins:{
legend:{
labels:{
color:"#fff"
}
}
},
scales:{
x:{
ticks:{color:"#fff"}
},
y:{
ticks:{color:"#fff"}
}
}
}
}
);

/* bar chart */
let c=0,w=0,s=0;

allResults.forEach(r=>{

c += Number(r.correct||0);
w += Number(r.wrong||0);
s += Number(r.skip||0);

});

new Chart(
document.getElementById("barChart"),
{
type:"bar",
data:{
labels:[
"Correct",
"Wrong",
"Skipped"
],
datasets:[{
data:[c,w,s],
backgroundColor:[
"#00ff99",
"#ff4d6d",
"#ffc107"
]
}]
},
options:{
responsive:true,
plugins:{
legend:{
display:false
}
},
scales:{
x:{
ticks:{color:"#fff"}
},
y:{
ticks:{color:"#fff"}
}
}
}
}
);

}
