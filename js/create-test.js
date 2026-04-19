import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

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

const bar=getEl("sidebar");
if(bar) bar.classList.toggle("active");

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
},1800);

}

function showError(msg){

const p=getEl("errorPopup");
p.innerText=msg;
p.classList.add("show");

setTimeout(()=>{
p.classList.remove("show");
},1500);

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

/* ================= LOAD FRIENDS ================= */
async function loadFriends(){

const snap =
await getDocs(collection(db,"friends"));

let html="";

for(const item of snap.docs){

const users =
item.data().users || [];

if(!users.includes(currentUser.uid))
continue;

const fid =
users.find(x=>x!==currentUser.uid);

if(!fid) continue;

let name="Friend";

const u =
await getDocs(
query(
collection(db,"users"),
where("__name__","==",fid)
)
);

if(!u.empty){
name =
u.docs[0].data().name ||
"Friend";
}

html += `
<label class="friend-item">
<input type="checkbox"
class="friendCheck"
value="${fid}">
<span>👤 ${name}</span>
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

/* ================= FILTER ================= */
function getFilteredQuestions(){

const subject =
getEl("subjectList").value.trim();

const chapter =
getEl("chapterList").value.trim();

const topic =
getEl("topicList").value.trim();

let arr=[...allBankQuestions];

if(subject)
arr=arr.filter(x=>x.subject===subject);

if(chapter)
arr=arr.filter(x=>x.chapter===chapter);

if(topic)
arr=arr.filter(x=>x.topic===topic);

return arr;

}

/* ================= NORMALIZE ANSWER ================= */
function idx(v){

if(v===null || v===undefined)
return 0;

if(typeof v==="number")
return v;

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

return 0;

}

function normalizeQuestion(q){

let ans = 0;

if(q.answer!==undefined)
ans = idx(q.answer);

else if(q.correct_option!==undefined)
ans = idx(q.correct_option);

else if(q.correctAnswer!==undefined)
ans = idx(q.correctAnswer);

return{

question:q.question || "",
options:q.options || [],
answer:ans

};

}

/* ================= CREATE ================= */
window.createTest = async()=>{

const testName =
getEl("testName").value.trim();

if(!testName){
showError("Enter Test Name");
return;
}

const count =
Number(getEl("questionCount").value);

let questions=[];

if(sourceMode==="bank"){

questions =
getFilteredQuestions();

}else{

try{
questions = JSON.parse(
getEl("manualJson").value.trim()
);
}catch{
showError("Invalid JSON");
return;
}

}

if(questions.length<count){
showError("Not sufficient questions");
return;
}

/* random pick */
questions =
questions
.sort(()=>Math.random()-0.5)
.slice(0,count)
.map(normalizeQuestion);

/* assign users */
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

/* result mode */
let resultMode="manual";

if(getEl("instantResult").checked)
resultMode="instant";

/* SAVE */
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

/* ================= DEFAULT ================= */
setSourceMode("bank");
