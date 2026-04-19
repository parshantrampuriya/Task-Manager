// admin-result.js

import { auth, db } from "./firebase.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl=(id)=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const testId=params.get("id");

let currentUser=null;
let allResults=[];
let testData=null;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
await loadData();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{
getEl("sidebar").classList.toggle("active");
};

/* ================= LOAD ================= */
async function loadData(){

if(!testId){
showToast("Test id missing");
return;
}

/* test data */
const testSnap=
await getDoc(doc(db,"tests",testId));

if(testSnap.exists()){
testData=testSnap.data();
getEl("pageTitle").innerText=
"📊 "+(testData.testName || "Admin Results");
}

/* results */
const snap=
await getDocs(collection(db,"results"));

allResults=[];

snap.forEach(d=>{

const x=d.data();

if(x.testId===testId){
allResults.push({
id:d.id,
...x
});
}

});

renderStats();
renderList();

}

/* ================= STATS ================= */
function renderStats(){

let total=allResults.length;
let sum=0;
let top=0;

allResults.forEach(r=>{

let s=Number(r.score||0);

sum+=s;

if(s>top) top=s;

});

getEl("totalStudents").innerText=total;
getEl("avgScore").innerText=
total>0?(sum/total).toFixed(1):0;
getEl("topScore").innerText=top;

}

/* ================= LIST ================= */
function renderList(){

let html="";

allResults.sort((a,b)=>
Number(b.score||0)-Number(a.score||0)
);

allResults.forEach((r,i)=>{

const passMarks=
Number(testData?.passMarks||0);

const pass=
Number(r.score||0)>=passMarks;

html+=`
<div class="result-row">

<div>
<b>${i+1}. ${r.userName || "Student"}</b>
</div>

<div>
${r.score}/${r.totalMarks}
</div>

<div>
${r.correct} ✔
</div>

<div class="${pass?'pass':'fail'}">
${pass?'Pass':'Fail'}
</div>

<div>
<button onclick="viewResult('${r.id}')">
👁 View
</button>
</div>

</div>
`;

});

if(!html){
html=`No attempts yet`;
}

getEl("studentList").innerHTML=html;

}

/* ================= INDEX ================= */
function idx(v){

if(v===null || v===undefined)
return -1;

if(typeof v==="number"){

if(v>=1 && v<=4) return v-1;
return v;

}

let s=String(v).trim().toUpperCase();

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
function getRight(q){

if(q.answerIndex!==undefined)
return idx(q.answerIndex);

if(q.correct_option!==undefined)
return idx(q.correct_option);

if(q.correctAnswer!==undefined)
return idx(q.correctAnswer);

if(q.correct!==undefined)
return idx(q.correct);

if(q.answer!==undefined){

let ans=String(q.answer).trim();

if(ans==="A") return 0;
if(ans==="B") return 1;
if(ans==="C") return 2;
if(ans==="D") return 3;

if(!isNaN(ans))
return idx(Number(ans));

for(let i=0;i<(q.options||[]).length;i++){

if(
String(q.options[i]).trim().toLowerCase()===
ans.toLowerCase()
){
return i;
}

}

}

return -1;

}

/* ================= VIEW RESULT ================= */
window.viewResult=(id)=>{

const r=
allResults.find(x=>x.id===id);

if(!r) return;

const qs=
r.questionsSnapshot || [];

const ans=
r.answers || [];

let html="";

qs.forEach((q,no)=>{

const marked=idx(ans[no]);
const right=getRight(q);

html+=`
<div class="answer-box">
<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options||[]).forEach((op,i)=>{

let cls="";
let note="";

if(i===right && i===marked){
cls="correct";
note=" ✅ Correct + Selected";
}
else if(i===right){
cls="correct";
note=" ✅ Correct";
}
else if(i===marked){
cls="wrong";
note=" ❌ Selected";
}

html+=`
<div class="opt ${cls}">
${String.fromCharCode(65+i)}. ${op}
${note}
</div>
`;

});

html+=`</div>`;

});

getEl("popupTitle").innerText=
r.userName+" Result";

getEl("popupContent").innerHTML=html;
getEl("popup").classList.add("show");

};

/* ================= CLOSE ================= */
window.closePopup=()=>{
getEl("popup").classList.remove("show");
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
