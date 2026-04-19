import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allBankQuestions=[];
let sourceMode="bank";

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

await loadSubjects();
await loadFriends();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{

getEl("sidebar")
.classList.toggle("active");

};

/* ================= MODE ================= */
window.setSourceMode=(mode)=>{

sourceMode=mode;

getEl("btnBank").classList.remove("active");
getEl("btnManual").classList.remove("active");

if(mode==="bank"){

getEl("btnBank").classList.add("active");
getEl("bankArea").style.display="block";
getEl("manualArea").style.display="none";

}else{

getEl("btnManual").classList.add("active");
getEl("bankArea").style.display="none";
getEl("manualArea").style.display="block";

}

};

/* ================= TOAST ================= */
function showToast(msg){

const t=getEl("toast");
t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1600);

}

function showError(msg){

const p=getEl("errorPopup");
p.innerText=msg;
p.classList.add("show");

setTimeout(()=>{
p.classList.remove("show");
},1500);

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

if(n>=1 && n<=4)
return n-1;

return n;

}

return -1;

}

/* ================= NORMALIZE ================= */
function normalizeQuestion(q){

const options=q.options || [];

let answerIndex=-1;
let answerText="";

/* text direct */
if(
typeof q.answer==="string" &&
isNaN(q.answer)
){
answerText=q.answer.trim();
}

/* old fields */
if(answerText===""){

const raw =
q.answer ??
q.correct_option ??
q.correctAnswer ??
q.correct ??
q.correctOption ??
q.rightAnswer ??
q.correct_index ??
q.answerIndex;

if(typeof raw==="string" && isNaN(raw)){

answerText=raw.trim();

}else{

answerIndex=idx(raw);

}

}

/* text => index */
if(answerText!==""){

options.forEach((op,i)=>{

if(
String(op).trim().toLowerCase() ===
answerText.toLowerCase()
){
answerIndex=i;
}

});

}

/* index => text */
if(answerIndex>=0 && answerText===""){
answerText=options[answerIndex] || "";
}

/* fallback */
if(answerIndex<0) answerIndex=0;
if(answerText==="") answerText=options[0] || "";

return{
question:q.question || "",
options,
answer:answerText,
answerIndex:answerIndex
};

}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects(){

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",currentUser.uid)
)
);

let subjects=[];

allBankQuestions=[];

snap.forEach(doc=>{

const d=doc.data();

allBankQuestions.push(d);

if(
d.subject &&
!subjects.includes(d.subject)
){
subjects.push(d.subject);
}

});

subjects.sort();

fillSelect("subjectList",subjects);
fillSelect("chapterList",[]);
fillSelect("topicList",[]);

}

/* ================= FRIENDS ================= */
async function loadFriends(){

const snap=
await getDocs(collection(db,"friends"));

let html="";

for(const item of snap.docs){

const users=
item.data().users || [];

if(!users.includes(currentUser.uid))
continue;

const fid=
users.find(x=>x!==currentUser.uid);

if(!fid) continue;

html += `
<label class="friend-item">
<input type="checkbox"
class="friendCheck"
value="${fid}">
<span>👤 Friend</span>
</label>
`;

}

getEl("friendList").innerHTML =
html || "No Friends";

}

/* ================= FILL ================= */
function fillSelect(id,arr){

let html=`<option value="">All</option>`;

arr.forEach(v=>{
html += `<option value="${v}">${v}</option>`;
});

getEl(id).innerHTML=html;

}

/* ================= SUBJECT CHANGE ================= */
getEl("subjectList").addEventListener("change",()=>{

const subject=
getEl("subjectList").value;

let chapters=[];

allBankQuestions.forEach(q=>{

if(
q.subject===subject &&
q.chapter &&
!chapters.includes(q.chapter)
){
chapters.push(q.chapter);
}

});

chapters.sort();

fillSelect("chapterList",chapters);
fillSelect("topicList",[]);

});

/* ================= CHAPTER CHANGE ================= */
getEl("chapterList").addEventListener("change",()=>{

const subject=
getEl("subjectList").value;

const chapter=
getEl("chapterList").value;

let topics=[];

allBankQuestions.forEach(q=>{

if(
q.subject===subject &&
q.chapter===chapter &&
q.topic &&
!topics.includes(q.topic)
){
topics.push(q.topic);
}

});

topics.sort();

fillSelect("topicList",topics);

});

/* ================= FILTER ================= */
function getFilteredQuestions(){

const subject=
getEl("subjectList").value.trim();

const chapter=
getEl("chapterList").value.trim();

const topic=
getEl("topicList").value.trim();

let arr=[...allBankQuestions];

if(subject)
arr=arr.filter(x=>x.subject===subject);

if(chapter)
arr=arr.filter(x=>x.chapter===chapter);

if(topic)
arr=arr.filter(x=>x.topic===topic);

return arr.map(normalizeQuestion);

}

/* ================= PREVIEW ================= */
window.previewTest=()=>{

let questions=[];

if(sourceMode==="bank"){

questions=getFilteredQuestions();

}else{

try{

questions=
JSON.parse(
getEl("manualJson").value.trim()
).map(normalizeQuestion);

}catch{

showError("Invalid JSON");
return;

}

}

const count=
Number(getEl("questionCount").value);

if(questions.length<count){
showError("Not sufficient questions");
return;
}

questions=questions.slice(0,count);

let html="";

questions.forEach((q,no)=>{

html += `
<div style="padding:12px;border:1px solid #ddd;margin-bottom:12px">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

(q.options || []).forEach((op,i)=>{

html += `
${String.fromCharCode(65+i)}.
${op}
${i===q.answerIndex ? " ✅ Correct":""}
<br>
`;

});

html += `</div>`;

});

getEl("previewBox").innerHTML=html;

};

/* ================= CREATE ================= */
window.createTest=async()=>{

const testName=
getEl("testName").value.trim();

if(!testName){
showError("Enter Test Name");
return;
}

const count=
Number(getEl("questionCount").value);

let questions=[];

if(sourceMode==="bank"){

questions=getFilteredQuestions();

}else{

try{

questions=
JSON.parse(
getEl("manualJson").value.trim()
).map(normalizeQuestion);

}catch{

showError("Invalid JSON");
return;

}

}

if(questions.length<count){
showError("Not sufficient questions");
return;
}

questions=
questions
.sort(()=>Math.random()-0.5)
.slice(0,count);

const assign=[];

if(getEl("assignSelf").checked)
assign.push(currentUser.uid);

document
.querySelectorAll(".friendCheck:checked")
.forEach(x=>{
assign.push(x.value);
});

if(assign.length===0){
showError("Select Candidate");
return;
}

let resultMode="manual";

if(getEl("instantResult").checked)
resultMode="instant";

await addDoc(
collection(db,"tests"),
{

createdBy:currentUser.uid,
testName,

totalMarks:
Number(getEl("totalMarks").value),

passMarks:
Number(getEl("passMarks").value),

duration:
Number(getEl("duration").value),

negativeMarks:
Number(getEl("negativeMarks").value),

shuffleQuestions:
getEl("shuffleQuestions").checked,

shuffleOptions:
getEl("shuffleOptions").checked,

resultMode,

assignedTo:assign,
questions,

createdAt:Date.now()

}
);

showToast("Test Created ✅");

};

setSourceMode("bank");
