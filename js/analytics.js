import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
doc,
getDoc
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

/* ================= INDEX ================= */
function idx(v){

if(v===null || v===undefined)
return -1;

if(typeof v==="number"){

if(v>=1 && v<=4) return v-1;
return v;

}

let s=
String(v).trim().toUpperCase();

if(s==="A") return 0;
if(s==="B") return 1;
if(s==="C") return 2;
if(s==="D") return 3;

let n=parseInt(s);

if(!isNaN(n)){

if(n>=1 && n<=4)
return n-1;

return n;
}

return -1;
}

/* ================= GET RIGHT ================= */
function getRight(q){

if(q.answer!==undefined)
return idx(q.answer);

if(q.correct_option!==undefined)
return idx(q.correct_option);

if(q.correctAnswer!==undefined)
return idx(q.correctAnswer);

return -1;

}

/* ================= LOAD RESULTS ================= */
async function loadResults(){

const snap = await getDocs(
query(
collection(db,"results"),
where("uid","==",currentUser.uid)
)
);

allResults=[];

for(const item of snap.docs){

let r={
id:item.id,
...item.data()
};

/* load test name from tests collection */
if(r.testId){

try{

const tsnap=
await getDoc(
doc(db,"tests",r.testId)
);

if(tsnap.exists()){

const t=tsnap.data();

r.testName =
t.testName ||
"Untitled Test";

r.passMarks =
Number(t.passMarks||0);

r.totalMarks =
Number(
r.totalMarks ||
t.totalMarks ||
0
);

}

}catch(e){}

}

/* recalculate correct wrong skip if old data missing */
if(
r.correct===undefined ||
r.wrong===undefined ||
r.skip===undefined
){

let correct=0;
let wrong=0;
let skip=0;

const qs =
r.questionsSnapshot || [];

const ans =
r.answers || [];

qs.forEach((q,i)=>{

const marked =
idx(ans[i]);

const right =
getRight(q);

if(marked===-1){

skip++;

}
else if(marked===right){

correct++;

}
else{

wrong++;

}

});

r.correct=correct;
r.wrong=wrong;
r.skip=skip;

}

allResults.push(r);

}

/* sort by date */
allResults.sort((a,b)=>
Number(a.submittedAt||0)-
Number(b.submittedAt||0)
);

renderSummary();
renderCharts();

}

/* ================= SUMMARY ================= */
function renderSummary(){

const total=allResults.length;

let sum=0;
let highest=-99999;
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

totalCorrect +=
Number(r.correct||0);

totalWrong +=
Number(r.wrong||0);

});

if(highest===-99999)
highest=0;

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

/* line */
new Chart(
document.getElementById("scoreChart"),
{
type:"line",
data:{
labels,
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
labels:{color:"#fff"}
}
},
scales:{
x:{ticks:{color:"#fff"}},
y:{ticks:{color:"#fff"}}
}
}
}
);

/* bar */
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
data:[correct,wrong,skip],
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
legend:{display:false}
},
scales:{
x:{ticks:{color:"#fff"}},
y:{ticks:{color:"#fff"}}
}
}
}
);

}
