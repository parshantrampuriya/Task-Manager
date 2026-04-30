import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let previewOpen = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
await loadSubjects();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{

const bar=getEl("sidebar");
if(bar) bar.classList.toggle("active");

};

/* ================= TOAST ================= */
function showToast(msg,type="success"){

const t=getEl("toast");

t.innerText=msg;
t.className="";
t.classList.add("show",type);

setTimeout(()=>{
t.classList.remove("show");
},2500);

}

/* ================= MODE ================= */
getEl("modeSelect").addEventListener("change",()=>{

const mode=getEl("modeSelect").value;

if(mode==="new"){

getEl("newArea").style.display="block";
getEl("existingArea").style.display="none";

}else{

getEl("newArea").style.display="none";
getEl("existingArea").style.display="block";

}

});

/* ================= UNIVERSAL INDEX ================= */
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

/* ================= NORMALIZE QUESTION ================= */
function normalizeQuestion(q){

const options=q.options || [];

let ansIndex=-1;
let ansText="";

if(typeof q.answer==="string" && isNaN(q.answer)){
ansText=q.answer.trim();
}

if(ansText===""){

const raw =
q.answer ??
q.correct_option ??
q.correctAnswer ??
q.correct ??
q.rightAnswer ??
q.answerText ??
q.correctOption;

if(typeof raw==="string" && isNaN(raw)){
ansText=raw.trim();
}else{
ansIndex=idx(raw);
}

}

if(ansText!==""){

options.forEach((op,i)=>{

if(
String(op).trim().toLowerCase() ===
ansText.toLowerCase()
){
ansIndex=i;
}

});

}

if(ansIndex>=0 && ansText===""){
ansText=options[ansIndex] || "";
}

if(ansIndex<0) ansIndex=0;
if(ansText==="") ansText=options[0] || "";

return{
question:q.question || "",
options,
answer:ansText,
answerIndex:ansIndex
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

let arr=[];

snap.forEach(doc=>{

const d=doc.data();

if(d.subject && !arr.includes(d.subject)){
arr.push(d.subject);
}

});

arr.sort();

fillSelect("subjectList",arr);
fillSelect("chapterList",["➕ Create New Chapter"]);
fillSelect("topicList",["➕ Create New Topic"]);

}

/* ================= SUBJECT CHANGE ================= */
getEl("subjectList").addEventListener("change",async()=>{

const subject=getEl("subjectList").value;

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",currentUser.uid),
where("subject","==",subject)
)
);

let arr=[];

snap.forEach(doc=>{

const d=doc.data();

if(d.chapter && !arr.includes(d.chapter)){
arr.push(d.chapter);
}

});

arr.sort();
arr.unshift("➕ Create New Chapter");

fillSelect("chapterList",arr);
fillSelect("topicList",["➕ Create New Topic"]);

toggleChapterInput();
toggleTopicInput();

});

/* ================= CHAPTER CHANGE ================= */
getEl("chapterList").addEventListener("change",async()=>{

toggleChapterInput();

const subject=getEl("subjectList").value;
const chapter=getEl("chapterList").value;

if(chapter==="➕ Create New Chapter"){
fillSelect("topicList",["➕ Create New Topic"]);
toggleTopicInput();
return;
}

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",currentUser.uid),
where("subject","==",subject),
where("chapter","==",chapter)
)
);

let arr=[];

snap.forEach(doc=>{

const d=doc.data();

if(d.topic && !arr.includes(d.topic)){
arr.push(d.topic);
}

});

arr.sort();
arr.unshift("➕ Create New Topic");

fillSelect("topicList",arr);

toggleTopicInput();

});

/* ================= TOPIC CHANGE ================= */
getEl("topicList").addEventListener("change",()=>{

toggleTopicInput();

});

/* ================= INPUT TOGGLE ================= */
function toggleChapterInput(){

const val=getEl("chapterList").value;

getEl("newChapterWrap").style.display =
val==="➕ Create New Chapter"
? "block"
: "none";

}

function toggleTopicInput(){

const val=getEl("topicList").value;

getEl("newTopicWrap").style.display =
val==="➕ Create New Topic"
? "block"
: "none";

}

/* ================= FILL ================= */
function fillSelect(id,data){

let html=`<option value="">Select</option>`;

data.forEach(v=>{
html += `<option value="${v}">${v}</option>`;
});

getEl(id).innerHTML=html;

}

/* ================= PREVIEW ================= */
window.previewQuestions=()=>{

const box=getEl("previewBox");

if(previewOpen){
box.innerHTML="No Preview Yet";
previewOpen=false;
return;
}

const raw=getEl("jsonBox").value.trim();

if(!raw){
showToast("Paste JSON First","error");
return;
}

let data=[];

try{
data=JSON.parse(raw);
}catch{
showToast("Invalid JSON","error");
return;
}

let html="";

data.forEach((item,no)=>{

const q=normalizeQuestion(item);

html += `
<div class="qbox">
<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options||[]).forEach((op,i)=>{

html += `
<div class="opt ${i===q.answerIndex ? 'correct':''}">
${String.fromCharCode(65+i)}.
${op}
${i===q.answerIndex ? ' ✅ Correct':''}
</div>
`;

});

html += `</div>`;

});

box.innerHTML=html;
previewOpen=true;

};

/* ================= SAVE ================= */
window.saveQuestions=async()=>{

const raw=getEl("jsonBox").value.trim();

if(!raw){
showToast("Paste JSON First","error");
return;
}

let data=[];

try{
data=JSON.parse(raw);
}catch{
showToast("Invalid JSON","error");
return;
}

let subject="",chapter="",topic="";

const mode=getEl("modeSelect").value;

if(mode==="new"){

subject=getEl("subject").value.trim();
chapter=getEl("chapter").value.trim();
topic=getEl("topic").value.trim();

}else{

subject=getEl("subjectList").value.trim();

chapter=getEl("chapterList").value.trim();
topic=getEl("topicList").value.trim();

if(chapter==="➕ Create New Chapter"){
chapter=getEl("newChapterInput").value.trim();
}

if(topic==="➕ Create New Topic"){
topic=getEl("newTopicInput").value.trim();
}

}

if(!subject){
showToast("Subject Required","error");
return;
}

/* existing */
const oldSnap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",currentUser.uid),
where("subject","==",subject),
where("chapter","==",chapter),
where("topic","==",topic)
)
);

let existing=[];

oldSnap.forEach(doc=>{

const d=doc.data();

existing.push(
JSON.stringify({
question:(d.question||"").trim(),
options:d.options||[],
answer:d.answer || (d.options||[])[d.answerIndex||0]
})
);

});

let saved=0;
let skipped=0;

for(let item of data){

const q=normalizeQuestion(item);

const sign=JSON.stringify({
question:q.question.trim(),
options:q.options,
answer:q.answer
});

if(existing.includes(sign)){
skipped++;
continue;
}

await addDoc(
collection(db,"questionBank"),
{
uid:currentUser.uid,
subject,
chapter,
topic,
question:q.question,
options:q.options,
answer:q.answer,
answerIndex:q.answerIndex,
createdAt:Date.now()
}
);

existing.push(sign);
saved++;

}

/* clear */
getEl("jsonBox").value="";
getEl("previewBox").innerHTML="No Preview Yet";

getEl("subject").value="";
getEl("chapter").value="";
getEl("topic").value="";

getEl("newChapterInput").value="";
getEl("newTopicInput").value="";

previewOpen=false;

await loadSubjects();

showToast(`${saved} Saved ✅ | ${skipped} Duplicate Skipped`);

};
