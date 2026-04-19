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

let currentUser=null;
let testData=null;
let resultData=null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
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

testData=testSnap.data();

const snap =
await getDocs(collection(db,"results"));

snap.forEach(d=>{

const x=d.data();

if(
x.testId===testId &&
x.uid===currentUser.uid
){
resultData=x;
}

});

if(!resultData){
showToast("Result not found");
return;
}

renderResult();
}

/* ================= ANSWER NORMALIZER ================= */
function getAnswerIndex(val){

if(val===null || val===undefined) return -1;

if(typeof val==="number") return val;

let v = String(val).trim().toUpperCase();

if(v==="A") return 0;
if(v==="B") return 1;
if(v==="C") return 2;
if(v==="D") return 3;

if(v==="OPTION1") return 0;
if(v==="OPTION2") return 1;
if(v==="OPTION3") return 2;
if(v==="OPTION4") return 3;

let num = Number(v);

if(!isNaN(num)){

if(num>=1 && num<=4) return num-1;
return num;
}

return -1;
}

/* ================= RESULT ================= */
function renderResult(){

const data=getAnalysis();

getEl("scoreText").innerText =
data.score + " / " + data.total;

getEl("percentText").innerText =
data.percent + "%";

getEl("statusText").innerText =
data.score >= data.passMarks
? "✅ Passed"
: "❌ Failed";

getEl("correctCount").innerText =
data.correct;

getEl("wrongCount").innerText =
data.wrong;

getEl("skipCount").innerText =
data.skip;

getEl("negativeCount").innerText =
data.negative;

getEl("accuracyText").innerText =
data.accuracy + "%";

getEl("rankText").innerText="--";

getEl("submitTime").innerText =
formatDate(resultData.submittedAt);

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

const negPercent =
Number(testData.negativeMarks || 0);

const perQ =
qs.length>0
? total / qs.length
: 0;

let correct=0;
let wrong=0;
let skip=0;
let score=0;

qs.forEach((q,i)=>{

const marked =
getAnswerIndex(ans[i]);

const right =
getAnswerIndex(q.answer);

if(marked===-1){
skip++;
return;
}

if(marked===right){

correct++;
score += perQ;

}else{

wrong++;
score -= perQ * (negPercent/100);

}

});

const negative =
(wrong * perQ * (negPercent/100))
.toFixed(2);

const attempted =
correct + wrong;

const accuracy =
attempted>0
? ((correct/attempted)*100).toFixed(1)
: 0;

const percent =
total>0
? ((score/total)*100).toFixed(1)
: 0;

return{
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

/* ================= VIEW ANSWERS ================= */
window.viewAnswers = ()=>{

const data=getAnalysis();

let html="";

data.qs.forEach((q,no)=>{

const marked =
getAnswerIndex(data.ans[no]);

const right =
getAnswerIndex(q.answer);

html += `
<div class="answer-item">
<h3>Q${no+1}. ${q.question}</h3>
`;

q.options.forEach((op,i)=>{

let note="";
let cls="";

if(i===right){
note += " ✅ Correct Answer";
cls="correct";
}

if(i===marked){

if(marked===right){
note += " | Your Marked";
}
else{
note += " ❌ Your Marked";
if(cls!=="correct"){
cls="wrong";
}
}

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

/* ================= DOWNLOAD REPORT ================= */
window.downloadPDF = ()=>{

const data=getAnalysis();

let report=`
<html>
<head>
<title>Result Report</title>
<style>
body{font-family:Arial;padding:30px;line-height:1.6;}
.q{margin-top:20px;padding:15px;border:1px solid #999;}
.green{color:green;font-weight:bold;}
.red{color:red;font-weight:bold;}
</style>
</head>
<body>

<h1>Test Result Report</h1>
<h2>${testData.testName || ""}</h2>

<p><b>Name:</b> ${
currentUser.displayName ||
currentUser.email
}</p>

<p><b>Score:</b> ${data.score}/${data.total}</p>
<p><b>Correct:</b> ${data.correct}</p>
<p><b>Wrong:</b> ${data.wrong}</p>
<p><b>Skipped:</b> ${data.skip}</p>
<p><b>Negative:</b> ${data.negative}</p>
<p><b>Accuracy:</b> ${data.accuracy}%</p>
<hr>
`;

data.qs.forEach((q,no)=>{

const marked =
getAnswerIndex(data.ans[no]);

const right =
getAnswerIndex(q.answer);

report += `
<div class="q">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

q.options.forEach((op,i)=>{

let txt="";

if(i===right){
txt += ` <span class="green">(Correct)</span>`;
}

if(i===marked){

if(marked===right){
txt += ` <span class="green">(Your Marked)</span>`;
}else{
txt += ` <span class="red">(Your Marked)</span>`;
}

}

report += `
${String.fromCharCode(65+i)}.
${op}
${txt}<br>
`;

});

report += `</div>`;

});

report += `</body></html>`;

const w=window.open("","_blank");

w.document.write(report);
w.document.close();
w.print();

};

/* ================= HELPERS ================= */
function formatDate(ms){

if(!ms) return "--";

return new Date(ms).toLocaleString();

}

function showToast(msg){

const t=getEl("toast");

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1500);

}
