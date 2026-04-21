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

/* ================= KEEP OLD ================= */
let sourceFilters=[];

/* ================= NEW SECTION MODE ================= */
let testMode="simple";
let sections=[];

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

/* ================= TEST MODE ================= */
window.setTestMode=(mode)=>{

testMode=mode;

getEl("simpleModeBtn")?.classList.remove("active");
getEl("sectionModeBtn")?.classList.remove("active");

if(mode==="simple"){

getEl("simpleModeBtn")?.classList.add("active");
getEl("sectionArea").style.display="none";
getEl("bankArea").style.display="block";

}else{

getEl("sectionModeBtn")?.classList.add("active");
getEl("sectionArea").style.display="block";
getEl("bankArea").style.display="block";

}

};

/* ================= SOURCE MODE ================= */
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
if(!t) return;

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}

function showError(msg){

const p=getEl("errorPopup");
if(!p) return;

p.innerText=msg;
p.classList.add("show");

setTimeout(()=>{
p.classList.remove("show");
},1600);

}

/* ================================================= */
/* ANSWER SYSTEM FIXED                               */
/* STORE EVERYWHERE: 1=A 2=B 3=C 4=D                 */
/* ================================================= */
function idx(v){

if(v===null || v===undefined) return -1;

if(typeof v==="number"){

if(v>=1 && v<=4) return v;

/* old 0-3 support */
if(v>=0 && v<=3) return v+1;

return -1;
}

let s=String(v).trim().toUpperCase();

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

/* ================= SHUFFLE ================= */
function shuffleArray(arr){

let a=[...arr];

for(let i=a.length-1;i>0;i--){

let j=Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];

}

return a;

}

/* ================= NORMALIZE ================= */
function normalizeQuestion(q){

const options=q.options || [];

let answerValue=-1;
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
answerValue=idx(raw);
}

}

/* text compare */
if(answerText!==""){

options.forEach((op,i)=>{

if(
String(op).trim().toLowerCase() ===
answerText.toLowerCase()
){
answerValue=i+1;
}

});

}

if(answerValue<1) answerValue=1;
if(answerText==="") answerText=options[answerValue-1] || "";

return{
question:q.question || "",
options,
answer:answerValue,       /* 1-4 */
answerIndex:answerValue,  /* keep same for old pages */
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
name=d.name || d.username || d.email || "Friend";

}

}catch(err){}

html+=`
<label class="friend-item">
<input type="checkbox"
class="friendCheck"
value="${fid}">
<span>👤 ${name}</span>
</label>
`;

optionHtml+=`
<option value="${fid}">
${name}
</option>
`;

}

getEl("friendList").innerHTML=html || "No Friends";

if(getEl("friendBankList")){
getEl("friendBankList").innerHTML=optionHtml;
}

}

/* ================= OWNER MODE ================= */
getEl("ownerMode")?.addEventListener("change",async()=>{

const mode=getEl("ownerMode").value;

if(mode==="self"){

selectedOwnerUid=currentUser.uid;
getEl("friendBankWrap").style.display="none";

}else{

selectedOwnerUid=getEl("friendBankList").value;
getEl("friendBankWrap").style.display="block";

}

await loadSubjects();

});

getEl("friendBankList")?.addEventListener("change",async()=>{

selectedOwnerUid=getEl("friendBankList").value;
await loadSubjects();

});

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

snap.forEach(docu=>{

const d=docu.data();

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
html+=`<option value="${v}">${v}</option>`;
});

getEl(id).innerHTML=html;

}

/* ================= SUBJECT CHANGE ================= */
getEl("subjectList")?.addEventListener("change",()=>{

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
getEl("chapterList")?.addEventListener("change",()=>{

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

/* ================= FILTER ================= */
function applyFilter(filter){

let arr=[...allBankQuestions];

if(filter.subject)
arr=arr.filter(x=>x.subject===filter.subject);

if(filter.chapter)
arr=arr.filter(x=>x.chapter===filter.chapter);

if(filter.topic)
arr=arr.filter(x=>x.topic===filter.topic);

return arr;

}

function getFilteredQuestions(){

return applyFilter({
subject:getEl("subjectList").value.trim(),
chapter:getEl("chapterList").value.trim(),
topic:getEl("topicList").value.trim()
}).map(normalizeQuestion);

}

/* ================= MULTI FILTER ================= */
function getSmartFilteredQuestions(){

if(sourceFilters.length===0){
return getFilteredQuestions();
}

let final=[];

sourceFilters.forEach(f=>{
final.push(...applyFilter(f));
});

let unique=[];
let seen=new Set();

final.forEach(q=>{

const key=(q.question||"")+JSON.stringify(q.options||[]);

if(!seen.has(key)){
seen.add(key);
unique.push(q);
}

});

return unique.map(normalizeQuestion);

}

/* ================= MULTI SOURCE ================= */
window.addSourceFilter=()=>{

const subject=getEl("subjectList").value.trim();
const chapter=getEl("chapterList").value.trim();
const topic=getEl("topicList").value.trim();

sourceFilters.push({subject,chapter,topic});

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
<div style="padding:10px;margin-bottom:8px;border:1px solid #333;border-radius:10px;display:flex;justify-content:space-between;">
<div>
${x.subject||"All"} /
${x.chapter||"All"} /
${x.topic||"All"}
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

/* ================= SECTIONS ================= */
window.addSectionBlock=()=>{

sections.push({
name:"Section "+(sections.length+1),
count:10,
sources:[]
});

renderSections();

};

window.addCurrentSelectionToSection=(i)=>{

const subject=getEl("subjectList").value.trim();
const chapter=getEl("chapterList").value.trim();
const topic=getEl("topicList").value.trim();

sections[i].sources.push({
subject,chapter,topic
});

renderSections();
showToast("Added To Section ✅");

};

function renderSections(){

const box=getEl("sectionListBox");
if(!box) return;

if(sections.length===0){
box.innerHTML="No sections added";
return;
}

let html="";

sections.forEach((s,i)=>{

let rows="";

if(s.sources.length===0){
rows="No sources added";
}else{

s.sources.forEach((r,n)=>{

rows+=`
<div style="margin-top:6px;padding:8px;border:1px solid #444;border-radius:8px;">
${r.subject||"All"} /
${r.chapter||"All"} /
${r.topic||"All"}
<button onclick="removeSectionSource(${i},${n})" style="float:right;">❌</button>
</div>
`;

});

}

html+=`
<div style="padding:14px;border:1px solid #333;border-radius:12px;margin-bottom:10px;">

<input
value="${s.name}"
oninput="updateSectionName(${i},this.value)"
placeholder="Section Name"
style="margin-bottom:10px;width:100%;">

<input
type="number"
value="${s.count}"
oninput="updateSectionCount(${i},this.value)"
placeholder="Questions"
style="margin-bottom:10px;width:100%;">

<button onclick="addCurrentSelectionToSection(${i})" style="margin-bottom:10px;width:100%;">
➕ Add Current Selection
</button>

<div style="margin-bottom:10px;">
${rows}
</div>

<button onclick="removeSection(${i})">❌ Remove</button>

</div>
`;

});

box.innerHTML=html;

}

window.removeSectionSource=(i,n)=>{

sections[i].sources.splice(n,1);
renderSections();

};

window.updateSectionName=(i,v)=>{
sections[i].name=v;
};

window.updateSectionCount=(i,v)=>{
sections[i].count=Number(v||0);
};

window.removeSection=(i)=>{
sections.splice(i,1);
renderSections();
};

/* ================= PREVIEW ================= */
window.previewTest=()=>{

let questions=[];

if(testMode==="section"){

sections.forEach(sec=>{

let pool=[];

if(sec.sources.length===0){
pool=getSmartFilteredQuestions();
}else{
sec.sources.forEach(f=>pool.push(...applyFilter(f)));
pool=pool.map(normalizeQuestion);
}

questions.push(
...shuffleArray(pool).slice(0,sec.count)
);

});

}else{

if(sourceMode==="bank"){
questions=getSmartFilteredQuestions();
}else{

try{
questions=
JSON.parse(getEl("manualJson").value.trim())
.map(normalizeQuestion);
}catch{
showError("Invalid JSON");
return;
}

}

const count=Number(getEl("questionCount").value);

if(questions.length<count){
showError("Not sufficient questions");
return;
}

questions=
shuffleArray(questions)
.slice(0,count);

}

let html="";

questions.forEach((q,no)=>{

html+=`
<div style="padding:12px;border:1px solid #333;margin-bottom:12px">
<b>Q${no+1}. ${q.question}</b><br><br>
`;

q.options.forEach((op,i)=>{

html+=`
${String.fromCharCode(65+i)}.
${op}
${(i+1)===q.answerIndex?" ✅ Correct":""}
<br>
`;

});

html+=`</div>`;

});

getEl("previewBox").innerHTML=html;

};

/* ================= DATE ================= */
function getTimeStamp(dateId,timeId){

const d=getEl(dateId).value;
const t=getEl(timeId).value;

if(!d || !t) return null;

return new Date(d+"T"+t).getTime();

}

/* ================= CREATE ================= */
window.createTest=async()=>{

const testName=getEl("testName").value.trim();

if(!testName){
showError("Enter Test Name");
return;
}

let questions=[];
let sectionData=[];

if(testMode==="section"){

if(sections.length===0){
showError("Add section first");
return;
}

for(const s of sections){

let pool=[];

if(s.sources.length===0){
pool=getSmartFilteredQuestions();
}else{
s.sources.forEach(f=>pool.push(...applyFilter(f)));
pool=pool.map(normalizeQuestion);
}

pool=shuffleArray(pool).slice(0,s.count);

sectionData.push({
name:s.name,
count:s.count,
sources:s.sources,
questions:pool
});

questions.push(...pool);

}

}else{

const count=Number(getEl("questionCount").value||0);

if(sourceMode==="bank"){
questions=getSmartFilteredQuestions();
}else{

try{
questions=
JSON.parse(getEl("manualJson").value.trim())
.map(normalizeQuestion);
}catch{
showError("Invalid JSON");
return;
}

}

if(questions.length<count){
showError("Not sufficient questions");
return;
}

questions=shuffleArray(questions).slice(0,count);

}

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

let resultMode="manual";

if(getEl("instantResult").checked)
resultMode="instant";

if(getEl("releaseLater").checked)
resultMode="later";

const startAt=getTimeStamp("startDate","startTime");
const endAt=getTimeStamp("endDate","endTime");

await addDoc(
collection(db,"tests"),
{

createdBy:currentUser.uid,
testName,
testDesc:getEl("testDesc").value.trim(),

totalMarks:Number(getEl("totalMarks").value||0),
passMarks:Number(getEl("passMarks").value||0),
duration:Number(getEl("duration").value||0),
negativeMarks:Number(getEl("negativeMarks").value||0),

shuffleQuestions:getEl("shuffleQuestions").checked,
shuffleOptions:getEl("shuffleOptions").checked,

resultMode,
resultReleased:resultMode==="instant",

assignedTo:assign,

questions,
multiSources:sourceFilters,

testMode,
sections:sectionData,

timerMode:getEl("timerMode")?.value || "common",
navMode:getEl("navMode")?.value || "free",

sourceMode,
sourceOwner:selectedOwnerUid,

startAt:startAt || null,
endAt:endAt || null,

attemptedUsers:[],
attemptCount:0,

createdAt:Date.now()

}
);

showToast("Test Created ✅");

};

/* ================= DEFAULT ================= */
setSourceMode("bank");
setTestMode("simple");

if(getEl("friendBankWrap")){
getEl("friendBankWrap").style.display="none";
}

renderSourceFilters();
renderSections();