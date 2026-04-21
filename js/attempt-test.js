import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
doc,
getDoc,
updateDoc,
collection,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);
const params = new URLSearchParams(location.search);
const testId = params.get("id");

let currentUser=null;
let testData=null;
let questions=[];

let currentIndex=0;
let answers=[];
let reviewList=[];

let totalSeconds=0;
let timerInt=null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
await loadTest();

});

/* ================= LOAD TEST ================= */
async function loadTest(){

if(!testId){
location.href="give-test.html";
return;
}

const snap = await getDoc(
doc(db,"tests",testId)
);

if(!snap.exists()){
showToast("Test not found");
return;
}

testData = snap.data();

/* one attempt only */
const attemptedUsers =
testData.attemptedUsers || [];

if(
attemptedUsers.includes(
currentUser.uid
)
){
showToast("Already Attempted");
setTimeout(()=>{
location.href="result.html?id="+testId;
},900);
return;
}

/* schedule check */
const now=Date.now();

const start=
Number(testData.startAt || 0);

const end=
Number(testData.endAt || 0);

if(start && now < start){

showToast("Test not started yet");

setTimeout(()=>{
location.href="give-test.html";
},1000);

return;
}

if(end && now > end){

showToast("Test expired");

setTimeout(()=>{
location.href="give-test.html";
},1000);

return;
}

/* keep existing features same */
questions =
JSON.parse(
JSON.stringify(testData.questions || [])
);

answers =
new Array(questions.length).fill(null);

reviewList =
new Array(questions.length).fill(false);

getEl("testTitle").innerText =
testData.testName || "Test";

getEl("candidateName").innerText =
currentUser.displayName ||
currentUser.email ||
"Candidate";

totalSeconds =
Number(testData.duration || 60) * 60;

startTimer();
renderPalette();
renderQuestion();

}

/* ================= TIMER ================= */
function startTimer(){

updateTimer();

timerInt = setInterval(()=>{

totalSeconds--;

updateTimer();

if(totalSeconds<=0){

clearInterval(timerInt);
finalSubmit();

}

},1000);

}

function updateTimer(){

const m =
Math.floor(totalSeconds/60);

const s =
totalSeconds % 60;

getEl("timer").innerText =
String(m).padStart(2,"0")
+ ":" +
String(s).padStart(2,"0");

}

/* ================= QUESTION ================= */
function renderQuestion(){

const q = questions[currentIndex];
if(!q) return;

getEl("questionNo").innerText =
"Question " + (currentIndex+1);

getEl("questionText").innerText =
q.question || "";

let html="";

(q.options || []).forEach((op,i)=>{

/* FIXED ACTIVE STATE */
const active =
answers[currentIndex]===op
? "active":"";

html += `
<button
class="option-btn ${active}"
onclick="selectOption(${i})">
${String.fromCharCode(65+i)}.
${op}
</button>
`;

});

getEl("optionList").innerHTML=html;

renderPalette();

}

/* ================= SELECT ================= */
window.selectOption=(i)=>{

const q = questions[currentIndex];

/* FIXED STORE REAL OPTION TEXT */
answers[currentIndex]=
q.options[i];

renderQuestion();

};

/* ================= NAVIGATION ================= */
window.nextQuestion=()=>{

if(currentIndex<questions.length-1){
currentIndex++;
renderQuestion();
}

};

window.prevQuestion=()=>{

if(currentIndex>0){
currentIndex--;
renderQuestion();
}

};

window.jumpQuestion=(i)=>{

currentIndex=i;
renderQuestion();

};

window.clearAnswer=()=>{

answers[currentIndex]=null;
renderQuestion();

};

window.markReview=()=>{

reviewList[currentIndex]=
!reviewList[currentIndex];

renderPalette();

showToast("Marked");

};

/* ================= PALETTE ================= */
function renderPalette(){

let html="";

questions.forEach((q,i)=>{

let cls="";

if(i===currentIndex)
cls="current";

else if(reviewList[i])
cls="review";

else if(answers[i]!==null)
cls="answered";

html += `
<button
class="pal-btn ${cls}"
onclick="jumpQuestion(${i})">
${i+1}
</button>
`;

});

getEl("paletteGrid").innerHTML =
html;

}

/* ================= POPUP ================= */
window.submitTest=()=>{

getEl("submitPopup")
.classList.add("show");

};

window.closePopup=()=>{

getEl("submitPopup")
.classList.remove("show");

};

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

if(n>=1 && n<=4)
return n-1;

return n;

}

return -1;

}

/* ================= RIGHT ANSWER ================= */
function getRight(q){

if(q.answerIndex!==undefined)
return idx(q.answerIndex);

if(
typeof q.answer==="string" &&
isNaN(q.answer)
){

const txt =
q.answer.trim().toLowerCase();

for(let i=0;i<(q.options||[]).length;i++){

if(
String(q.options[i])
.trim()
.toLowerCase()===txt
){
return i;
}

}

}

if(q.answer!==undefined)
return idx(q.answer);

if(q.correct_option!==undefined)
return idx(q.correct_option);

if(q.correctAnswer!==undefined)
return idx(q.correctAnswer);

if(q.correct!==undefined)
return idx(q.correct);

return -1;

}

/* ================= FINAL SUBMIT ================= */
window.finalSubmit = async()=>{

clearInterval(timerInt);

const totalMarks =
Number(testData.totalMarks || 0);

const totalQ =
questions.length;

const perQ =
totalQ>0
? totalMarks / totalQ
: 0;

const negPercent =
Number(testData.negativeMarks || 0);

const negPerWrong =
perQ * (negPercent/100);

let score=0;
let correct=0;
let wrong=0;
let skip=0;

questions.forEach((q,i)=>{

const markedText =
answers[i];

const right =
getRight(q);

if(markedText===null){

skip++;

}
else if(
String(markedText)
.trim()
.toLowerCase()
===
String(q.options[right])
.trim()
.toLowerCase()
){

correct++;
score += perQ;

}
else{

wrong++;
score -= negPerWrong;

}

});

const resultData = {

testId,
uid: currentUser.uid,

userName:
currentUser.displayName ||
currentUser.email,

testName:
testData.testName || "Test",

score:
Number(score.toFixed(2)),

totalMarks,

marksPerQuestion:
Number(perQ.toFixed(2)),

negativePerWrong:
Number(negPerWrong.toFixed(2)),

correct,
wrong,
skip,

negativeMarks:
Number(
(wrong*negPerWrong).toFixed(2)
),

submittedAt:
Date.now(),

answers,
questionsSnapshot:questions

};

await addDoc(
collection(db,"results"),
resultData
);

/* attempt update */
let arr =
testData.attemptedUsers || [];

if(!arr.includes(currentUser.uid)){

arr.push(currentUser.uid);

await updateDoc(
doc(db,"tests",testId),
{
attemptedUsers:arr,
attemptCount:arr.length
}
);

}

location.href =
"result.html?id="+testId;

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