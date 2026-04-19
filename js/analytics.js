import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allResults=[];

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

await loadResults();

});

/* ================= LOAD RESULTS ================= */
async function loadResults(){

const snap = await getDocs(
query(
collection(db,"results"),
where("uid","==",currentUser.uid)
)
);

allResults=[];

snap.forEach(doc=>{

allResults.push({
id:doc.id,
...doc.data()
});

});

/* sort by time */
allResults.sort((a,b)=>
Number(a.submittedAt||0)-
Number(b.submittedAt||0)
);

renderSummary();
renderCharts();

}

/* ================= SUMMARY ================= */
function renderSummary(){

const total = allResults.length;

let sum=0;
let highest=0;
let passed=0;

let bestTest="-";
let lowTest="-";

let bestVal=-99999;
let lowVal=99999;

let totalCorrect=0;
let totalWrong=0;

allResults.forEach(r=>{

const score=
Number(r.score||0);

sum += score;

if(score>highest)
highest=score;

if(score>=0)
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

totalCorrect +=
Number(r.correct||0);

totalWrong +=
Number(r.wrong||0);

});

const avg =
total>0
? (sum/total).toFixed(1)
: 0;

const passRate =
total>0
? ((passed/total)*100).toFixed(1)
: 0;

const accuracy =
(totalCorrect+totalWrong)>0
? (
(totalCorrect/
(totalCorrect+totalWrong))*100
).toFixed(1)
: 0;

let improve=0;

if(total>=2){

const first=
Number(allResults[0].score||0);

const last=
Number(
allResults[total-1].score||0
);

improve=
(last-first).toFixed(1);

}

/* set values */
getEl("totalTests").innerText=total;
getEl("avgScore").innerText=avg;
getEl("highScore").innerText=highest;
getEl("passRate").innerText=passRate+"%";

getEl("bestTest").innerText=bestTest;
getEl("lowTest").innerText=lowTest;
getEl("accuracy").innerText=accuracy+"%";
getEl("improve").innerText=improve;

}

/* ================= CHARTS ================= */
function renderCharts(){

const labels=[];
const scoreData=[];

let correct=0;
let wrong=0;
let skip=0;

allResults.forEach((r,i)=>{

labels.push(
r.testName ||
("Test "+(i+1))
);

scoreData.push(
Number(r.score||0)
);

correct +=
Number(r.correct||0);

wrong +=
Number(r.wrong||0);

skip +=
Number(r.skip||0);

});

/* line chart */
new Chart(
document.getElementById("scoreChart"),
{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Score",
data:scoreData,
borderColor:"#00ffff",
backgroundColor:"rgba(0,255,255,.15)",
fill:true,
tension:0.4
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
data:[
correct,
wrong,
skip
],
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
