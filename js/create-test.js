import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
addDoc,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allBankQuestions=[];
let sourceMode="bank";
let selectedOwnerUid="";

/* ================= NEW MULTI SOURCE ================= */
let sourceFilters=[];

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
selectedOwnerUid=user.uid;

await loadFriends();
await loadSubjects();

});

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
},1800);

}

function showError(msg){

const p=getEl("errorPopup");
p.innerText=msg;
p.classList.add("show");

setTimeout(()=>{
p.classList.remove("show");
},1600);

}

/* ================= INDEX ================= */
function idx(v){

if(v===null || v===undefined) return -1;

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

/* ================= RANDOM SHUFFLE ================= */
function shuffleArray(arr){

let newArr=[...arr];

for(let i=newArr.length-1;i>0;i--){

let j=Math.floor(Math.random()*(i+1));

[newArr[i],newArr[j]]=
[newArr[j],newArr[i]];

}

return newArr;

}

/* ================= NORMALIZE ================= */
function normalizeQuestion(q){

const options=q.options || [];

let answerIndex=-1;
let answerText="";

if(typeof q.answer==="string" && isNaN(q.answer)){
answerText=q.answer.trim();
}

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

if(answerIndex<0) answerIndex=0;
if(answerText==="") answerText=options[answerIndex] || "";

return{
question:q.question || "",
options,
answer:answerText,
answerIndex,
subject:q.subject || "",
chapter:q.chapter || "",
topic:q.topic || ""
};

}

/* ================= LOAD FRIENDS ================= */
async function loadFriends(){

const snap=await getDocs(collection(db,"friends"));

let html="";
let optionHtml=`<option value="">Select Friend</option>`;

for(const item of snap.docs){

const users=item.data().users || [];

if(!users.includes(currentUser.uid))
continue;

const fid=users.find(x=>x!==currentUser.uid);

if(!fid) continue;

let name="Friend";

try{

const u=await getDoc(doc(db,"users",fid));

if(u.exists()){

const d=u.data();

name=
d.name ||
d.username ||
d.email ||
"Friend";

}

}catch(err){}

html += `
<label class="friend-item">
<input type="checkbox"
class="friendCheck"
value="${fid}">
<span>👤 ${name}</span>
</label>
`;

optionHtml += `
<option value="${fid}">
${name}
</option>
`;

}

getEl("friendList").innerHTML =
html || "No Friends";

if(getEl("friendBankList")){
getEl("friendBankList").innerHTML =
optionHtml;
}

}

/* ================= OWNER MODE ================= */
if(getEl("ownerMode")){

getEl("ownerMode").addEventListener("change",async()=>{

const mode=getEl("ownerMode").value;

if(mode==="self"){

selectedOwnerUid=currentUser.uid;
getEl("friendBankWrap").style.display="none";

}else{

selectedOwnerUid=
getEl("friendBankList").value;

getEl("friendBankWrap").style.display="block";

}

sourceFilters=[];
renderSourceFilters();

await loadSubjects();

});

}

if(getEl("friendBankList")){

getEl("friendBankList").addEventListener("change",async()=>{

selectedOwnerUid=
getEl("friendBankList").value;

sourceFilters=[];
renderSourceFilters();

await loadSubjects();

});

}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects(){

if(!selectedOwnerUid){
fillSelect("subjectList",[]);
fillSelect("chapterList",[]);
fillSelect("topicList",[]);
return;
}

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",selectedOwnerUid)
)
);

allBankQuestions=[];

let subjects=[];

snap.forEach(doc=>{

const d=doc.data();

allBankQuestions.push(d);

if(d.subject && !subjects.includes(d.subject)){
subjects.push(d.subject);
}

});

subjects.sort();

fillSelect("subjectList",subjects);
fillSelect("chapterList",[]);
fillSelect("topicList",[]);

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

const subject=getEl("subjectList").value;

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

const subject=getEl("subjectList").value;
const chapter=getEl("chapterList").value;

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

/* ================= OLD FILTER ================= */
function getFilteredQuestions(){

const subject=getEl("subjectList").value.trim();
const chapter=getEl("chapterList").value.trim();
const topic=getEl("topicList").value.trim();

let arr=[...allBankQuestions];

if(subject)
arr=arr.filter(x=>x.subject===subject);

if(chapter)
arr=arr.filter(x=>x.chapter===chapter);

if(topic)
arr=arr.filter(x=>x.topic===topic);

return arr.map(normalizeQuestion);

}

/* ================= NEW MULTI FILTER ================= */
function getSmartFilteredQuestions(){

if(sourceFilters.length===0){
return getFilteredQuestions();
}

let finalList=[];

sourceFilters.forEach(f=>{

let arr=[...allBankQuestions];

if(f.subject)
arr=arr.filter(x=>x.subject===f.subject);

if(f.chapter)
arr=arr.filter(x=>x.chapter===f.chapter);

if(f.topic)
arr=arr.filter(x=>x.topic===f.topic);

finalList.push(...arr);

});

/* duplicate remove */
let unique=[];
let seen=new Set();

finalList.forEach(q=>{

const key=
(q.question||"")+
JSON.stringify(q.options||[]);

if(!seen.has(key)){
seen.add(key);
unique.push(q);
}

});

return unique.map(normalizeQuestion);

}

/* ================= NEW ADD FILTER ================= */
window.addSourceFilter=()=>{

const subject=getEl("subjectList").value.trim();
const chapter=getEl("chapterList").value.trim();
const topic=getEl("topicList").value.trim();

if(!subject && !chapter && !topic){
showError("Select any filter first");
return;
}

sourceFilters.push({
subject,
chapter,
topic
});

renderSourceFilters();
showToast("Source Added ✅");

};

function renderSourceFilters(){

const box=getEl("sourceListBox");
if(!box) return;

if(sourceFilters.length===0){
box.innerHTML="No extra sources added";
return;
}

let html="";

sourceFilters.forEach((x,i)=>{

html+=`
<div style="padding:10px;margin-bottom:8px;border:1px solid #333;border-radius:10px;display:flex;justify-content:space-between;gap:10px;">
<div>
${x.subject || "All"} /
${x.chapter || "All"} /
${x.topic || "All"}
</div>

<button onclick="removeSourceFilter(${i})">❌</button>
</div>
`;

});

box.innerHTML=html;

}

window.removeSourceFilter=(i)=>{

sourceFilters.splice(i,1);
renderSourceFilters();

};

/* ================= PREVIEW ================= */
window.previewTest=()=>{

let questions=[];

if(sourceMode==="bank"){

questions=getSmartFilteredQuestions();

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

questions=
shuffleArray(questions)
.slice(0,count);

let html="";

questions.forEach((q,no)=>{

html += `
<div style="padding:12px;border:1px solid #333;margin-bottom:12px">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

q.options.forEach((op,i)=>{

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

/* ================= DATE HELPER ================= */
function getTimeStamp(dateId,timeId){

const d=getEl(dateId).value;
const t=getEl(timeId).value;

if(!d || !t) return null;

return new Date(d+"T"+t).getTime();

}

/* ================= CREATE ================= */
window.createTest=async()=>{

const testName=
getEl("testName").value.trim();

if(!testName){
showError("Enter Test Name");
return;
}

const count=
Number(getEl("questionCount").value || 0);

let questions=[];

if(sourceMode==="bank"){

questions=getSmartFilteredQuestions();

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
shuffleArray(questions)
.slice(0,count);

/* assign */
const assign=[];

if(getEl("assignSelf").checked)
assign.push(currentUser.uid);

document
.querySelectorAll(".friendCheck:checked")
.forEach(x=>assign.push(x.value));

if(assign.length===0){
showError("Select Candidate");
return;
}

/* result mode */
let resultMode="manual";

if(getEl("instantResult").checked)
resultMode="instant";

if(getEl("releaseLater").checked)
resultMode="later";

/* schedule */
const startAt =
getTimeStamp("startDate","startTime");

const endAt =
getTimeStamp("endDate","endTime");

if(startAt && endAt && endAt<=startAt){
showError("End must be after Start");
return;
}

await addDoc(
collection(db,"tests"),
{

createdBy:currentUser.uid,
testName,

testDesc:
getEl("testDesc").value.trim(),

totalMarks:
Number(getEl("totalMarks").value || 0),

passMarks:
Number(getEl("passMarks").value || 0),

duration:
Number(getEl("duration").value || 0),

negativeMarks:
Number(getEl("negativeMarks").value || 0),

shuffleQuestions:
getEl("shuffleQuestions").checked,

shuffleOptions:
getEl("shuffleOptions").checked,

resultMode,
resultReleased:
resultMode==="instant",

assignedTo:assign,
questions,

sourceMode,
sourceOwner:selectedOwnerUid,

multiSources:sourceFilters,

startAt:startAt || null,
endAt:endAt || null,

attemptedUsers:[],
attemptCount:0,

createdAt:Date.now()

}
);

showToast("Test Created ✅");

};

/* default */
setSourceMode("bank");

if(getEl("friendBankWrap")){
getEl("friendBankWrap").style.display="none";
}

renderSourceFilters();
