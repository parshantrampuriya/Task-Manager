import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
getDocs,
collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);
const params = new URLSearchParams(location.search);
const testId = params.get("id");

let currentUser = null;
let testData = null;
let resultData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;
await loadData();

});

/* ================= LOAD ================= */
async function loadData(){

if(!testId){
location.href="give-test.html";
return;
}

const testSnap =
await getDoc(doc(db,"tests",testId));

if(!testSnap.exists()){
showToast("Test not found");
return;
}

testData = testSnap.data();

/* find my result */
const snap =
await getDocs(collection(db,"results"));

snap.forEach(d=>{

const x = d.data();

if(
x.testId===testId &&
x.uid===currentUser.uid
){
resultData = x;
}

});

if(!resultData){
showToast("Result not found");
return;
}

/* RESULT RELEASE CONTROL */
if(
testData.resultMode==="later" &&
!testData.resultReleased
){

getEl("scoreText").innerText="--";
getEl("percentText").innerText="--";
getEl("statusText").innerText=
"⏳ Result will release later";

getEl("correctCount").innerText="--";
getEl("wrongCount").innerText="--";
getEl("skipCount").innerText="--";
getEl("negativeCount").innerText="--";
getEl("accuracyText").innerText="--";
getEl("rankText").innerText="--";

getEl("submitTime").innerText =
new Date(resultData.submittedAt)
.toLocaleString();

return;
}

renderResult();

}

/* ================================================= */
/* STANDARD SYSTEM EVERYWHERE                        */
/* 1 = A                                             */
/* 2 = B                                             */
/* 3 = C                                             */
/* 4 = D                                             */
/* -1 = Skip                                         */
/* ================================================= */

function idx(v){

if(v===null || v===undefined)
return -1;

/* direct number */
if(typeof v==="number"){

if(v>=1 && v<=4) return v;

/* old saved 0-3 support */
if(v>=0 && v<=3) return v+1;

return -1;
}

let s =
String(v).trim().toUpperCase();

if(s==="A") return 1;
if(s==="B") return 2;
if(s==="C") return 3;
if(s==="D") return 4;

let n=parseInt(s);

if(!isNaN(n)){

if(n>=1 && n<=4) return n;
if(n>=0 && n<=3) return n+1;

}

return -1;

}

/* ================= RIGHT ANSWER ================= */
function getCorrectValue(q){

const options = q.options || [];

const tryValue = (val)=>{

if(val===undefined || val===null)
return -1;

let s = String(val).trim();
let u = s.toUpperCase();

/* A B C D */
if(u==="A") return 1;
if(u==="B") return 2;
if(u==="C") return 3;
if(u==="D") return 4;

/* 1 2 3 4 */
if(!isNaN(s)){

let n = Number(s);

if(n>=1 && n<=4) return n;
if(n>=0 && n<=3) return n+1;

}

/* text compare */
for(let i=0;i<options.length;i++){

if(
String(options[i]).trim().toLowerCase()
===
s.toLowerCase()
){
return i+1;
}

}

return -1;
};

let fields = [
q.answer,
q.correct_option,
q.correctAnswer,
q.correct,
q.rightAnswer,
q.answerIndex
];

for(let f of fields){

let r = tryValue(f);

if(r!==-1) return r;

}

return -1;

}

/* ================= ANALYSIS ================= */
function getAnalysis(){

const qs =
resultData.questionsSnapshot ||
testData.questions ||
[];

const ans =
resultData.answers || [];

const total =
Number(resultData.totalMarks || 0);

const passMarks =
Number(testData.passMarks || 0);

const perQ =
Number(resultData.marksPerQuestion || 0) ||
(qs.length>0 ? total/qs.length : 0);

const negPerWrong =
Number(resultData.negativePerWrong || 0) ||
(
perQ *
(Number(testData.negativeMarks || 0)/100)
);

let correct=0;
let wrong=0;
let skip=0;
let score=0;

qs.forEach((q,i)=>{

const marked = idx(ans[i]);
const right = getCorrectValue(q);

if(marked===-1){

skip++;

}
else if(marked===right){

correct++;
score += perQ;

}
else{

wrong++;
score -= negPerWrong;

}

});

const negative =
(wrong * negPerWrong).toFixed(2);

const attempted =
correct + wrong;

const accuracy =
attempted>0
? ((correct/attempted)*100).toFixed(1)
: "0";

const percent =
total>0
? ((score/total)*100).toFixed(1)
: "0";

return {
qs,
ans,
score:Number(score.toFixed(2)),
total,
passMarks,
correct,
wrong,
skip,
negative,
accuracy,
percent
};

}

/* ================= RENDER ================= */
function renderResult(){

const d=getAnalysis();

getEl("scoreText").innerText =
d.score + " / " + d.total;

getEl("percentText").innerText =
d.percent + "%";

getEl("statusText").innerText =
d.score >= d.passMarks
? "✅ Passed"
: "❌ Failed";

getEl("correctCount").innerText=d.correct;
getEl("wrongCount").innerText=d.wrong;
getEl("skipCount").innerText=d.skip;
getEl("negativeCount").innerText=d.negative;
getEl("accuracyText").innerText=d.accuracy + "%";
getEl("rankText").innerText="--";

getEl("submitTime").innerText =
new Date(resultData.submittedAt)
.toLocaleString();

}

/* ================= VIEW ANSWERS ================= */
window.viewAnswers = ()=>{

if(
testData.resultMode==="later" &&
!testData.resultReleased
){
showToast("Result not released yet");
return;
}

const d=getAnalysis();

let html="";

d.qs.forEach((q,no)=>{

const marked = idx(d.ans[no]);
const right = getCorrectValue(q);

html += `
<div class="answer-item">
<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options || []).forEach((op,i)=>{

const val = i+1;

let cls="";
let note="";

const isRight = val===right;
const isMarked = val===marked;

if(isRight && isMarked){

cls="correct";
note=" ✅ Correct | Your Selected";

}
else if(isRight){

cls="correct";
note=" ✅ Correct";

}
else if(isMarked){

cls="wrong";
note=" ❌ Your Selected";

}

html += `
<div class="opt-line ${cls}">
${String.fromCharCode(65+i)}.
${op}
${note}
</div>
`;

});

html += `</div>`;

});

getEl("answerList").innerHTML=html;

getEl("answerPopup")
.classList.add("show");

};

window.closePopup = ()=>{

getEl("answerPopup")
.classList.remove("show");

};

/* ================= PDF ================= */
window.downloadPDF = ()=>{

if(
testData.resultMode==="later" &&
!testData.resultReleased
){
showToast("Result not released yet");
return;
}

const d=getAnalysis();

let html=`
<html>
<head>
<title>Result</title>
<style>
body{font-family:Arial;padding:30px;line-height:1.6}
.q{border:1px solid #999;padding:15px;margin-top:20px}
.green{color:green;font-weight:bold}
.red{color:red;font-weight:bold}
</style>
</head>
<body>

<h1>${testData.testName || "Test Result"}</h1>

<p><b>Name:</b>
${currentUser.displayName || currentUser.email}</p>

<p><b>Score:</b> ${d.score}/${d.total}</p>
<p><b>Correct:</b> ${d.correct}</p>
<p><b>Wrong:</b> ${d.wrong}</p>
<p><b>Skipped:</b> ${d.skip}</p>

<hr>
`;

d.qs.forEach((q,no)=>{

const marked = idx(d.ans[no]);
const right = getCorrectValue(q);

html += `
<div class="q">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

(q.options || []).forEach((op,i)=>{

const val = i+1;

let note="";

if(val===right)
note+=` <span class="green">(Correct)</span>`;

if(val===marked && val!==right)
note+=` <span class="red">(Your Selected)</span>`;

if(val===marked && val===right)
note+=` <span class="green">(Your Selected)</span>`;

html += `
${String.fromCharCode(65+i)}.
${op}
${note}<br>
`;

});

html += `</div>`;

});

html += `
</body>
</html>
`;

const w = window.open("","_blank");
w.document.write(html);
w.document.close();
w.print();

};

/* ================= TOAST ================= */
function showToast(msg){

const t=getEl("toast");

if(!t) return;

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1500);

}