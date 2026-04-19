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

/* ================= INDEX ================= */
function idx(v){

if(v===null || v===undefined)
return -1;

if(typeof v==="number"){

if(v>=1 && v<=4) return v-1;
return v;

}

let s =
String(v).trim().toUpperCase();

if(s==="A") return 0;
if(s==="B") return 1;
if(s==="C") return 2;
if(s==="D") return 3;

let n=parseInt(s);

if(!isNaN(n)){

if(n>=1 && n<=4) return n-1;
return n;

}

return -1;

}

/* ================= RIGHT ANSWER ================= */
function getCorrectIndex(q){

    /* direct answerIndex */
    if(q.answerIndex !== undefined && q.answerIndex !== null){
        return Number(q.answerIndex);
    }

    /* old fields */
    if(q.correct_option !== undefined) return idx(q.correct_option);
    if(q.correctAnswer !== undefined) return idx(q.correctAnswer);
    if(q.correct !== undefined) return idx(q.correct);

    /* answer field exists */
    if(q.answer !== undefined && q.answer !== null){

        let ans = String(q.answer).trim();

        /* A B C D */
        if(ans.toUpperCase() === "A") return 0;
        if(ans.toUpperCase() === "B") return 1;
        if(ans.toUpperCase() === "C") return 2;
        if(ans.toUpperCase() === "D") return 3;

        /* 1 2 3 4 */
        if(!isNaN(ans)){
            return idx(Number(ans));
        }

        /* text match with options */
        for(let i=0;i<(q.options || []).length;i++){

            if(
                String(q.options[i]).trim().toLowerCase() ===
                ans.toLowerCase()
            ){
                return i;
            }

        }
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
(perQ * (
Number(testData.negativeMarks || 0) / 100
));

let correct=0;
let wrong=0;
let skip=0;
let score=0;

qs.forEach((q,i)=>{

const marked = idx(ans[i]);
const right = getCorrectIndex(q);

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
const right = getCorrectIndex(q);

html += `
<div class="answer-item">
<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options || []).forEach((op,i)=>{

let cls="";
let note="";

const isRight = i===right;
const isMarked = i===marked;

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
const right = getCorrectIndex(q);

html += `
<div class="q">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

(q.options || []).forEach((op,i)=>{

let note="";

if(i===right)
note+=` <span class="green">(Correct)</span>`;

if(i===marked && i!==right)
note+=` <span class="red">(Your Selected)</span>`;

if(i===marked && i===right)
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

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1500);

}
