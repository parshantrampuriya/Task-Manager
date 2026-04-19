/* ================= UPDATED view-question.js ================= */
/* OLD FEATURES KEPT + NEW UNIVERSAL ANSWER SUPPORT */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allQuestions = [];
let currentPath = [];
let selectedQuestion = null;

/* ================= FRIEND MODE ================= */
const params = new URLSearchParams(window.location.search);
const friendUid = params.get("uid");

let readOnly = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

if(
friendUid &&
friendUid.trim()!=="" &&
friendUid!==user.uid
){
readOnly=true;
}

await loadAllQuestions();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{

const bar=getEl("sidebar");
if(bar) bar.classList.toggle("active");

};

/* ================= UNIVERSAL INDEX ================= */
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

/* ================= GET CORRECT INDEX ================= */
function getCorrectIndex(q){

/* new format */
if(q.answerIndex!==undefined)
return idx(q.answerIndex);

/* text answer */
if(
typeof q.answer==="string" &&
isNaN(q.answer)
){

const txt=q.answer.trim().toLowerCase();

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

/* old format */
if(q.answer!==undefined)
return idx(q.answer);

if(q.correct_option!==undefined)
return idx(q.correct_option);

if(q.correctAnswer!==undefined)
return idx(q.correctAnswer);

if(q.correct!==undefined)
return idx(q.correct);

return 0;

}

/* ================= LOAD ================= */
async function loadAllQuestions(){

const targetUid =
(readOnly && friendUid)
? friendUid
: currentUser.uid;

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",targetUid)
)
);

allQuestions=[];

snap.forEach(doc=>{

allQuestions.push({
id:doc.id,
...doc.data()
});

});

renderFiles();

}

/* ================= RENDER ================= */
function renderFiles(){

const fileArea=getEl("fileArea");
const pathText=getEl("pathText");
const viewBtn=getEl("viewAllBtn");

pathText.innerText=
currentPath.length===0
? "Home"
: currentPath.join(" > ");

let folders=[];
let questions=[];

allQuestions.forEach(q=>{

const levels=[
q.subject || "",
q.chapter || "",
q.topic || ""
].filter(v=>v!=="");

let ok=true;

for(let i=0;i<currentPath.length;i++){

if(levels[i]!==currentPath[i]){
ok=false;
break;
}

}

if(!ok) return;

if(levels.length>currentPath.length){

const next=
levels[currentPath.length];

if(next && !folders.includes(next))
folders.push(next);

}else{
questions.push(q);
}

});

folders.sort((a,b)=>a.localeCompare(b));

questions.sort((a,b)=>
(a.question||"")
.localeCompare(b.question||"")
);

if(viewBtn){

viewBtn.style.display=
questions.length>0
? "inline-flex"
: "none";

}

let html="";

/* folders */
folders.forEach(name=>{

html += `
<div class="file-item folder"
onclick="openFolder('${safe(name)}')">

<div class="file-icon">📁</div>
<div class="file-name">${name}</div>

</div>
`;

});

/* questions */
questions.forEach((q,no)=>{

html += `
<div class="file-item question"
onclick="openQuestion('${q.id}')">

<div class="file-icon">📄</div>

<div class="file-name">
Q${no+1}. ${q.question}
</div>

</div>
`;

});

if(!html){

html=`
<div class="file-item">
<div class="file-name">
Empty Folder
</div>
</div>
`;

}

fileArea.innerHTML=html;

}

/* ================= SAFE ================= */
function safe(text){
return text.replace(/'/g,"\\'");
}

/* ================= FOLDER ================= */
window.openFolder=(name)=>{

currentPath.push(name);
renderFiles();

};

window.goFolderBack=()=>{

if(currentPath.length>0){
currentPath.pop();
renderFiles();
}

};

/* ================= OPEN QUESTION ================= */
window.openQuestion=(id)=>{

selectedQuestion=
allQuestions.find(x=>x.id===id);

if(!selectedQuestion) return;

getEl("popupQuestion").innerText=
selectedQuestion.question;

if(readOnly){

getEl("popupContent").innerHTML=`
<div class="popup-btn-row">

<button class="preview-btn"
onclick="previewQuestion()">
👁 Preview
</button>

</div>
`;

}else{

getEl("popupContent").innerHTML=`
<div class="popup-btn-row">

<button class="preview-btn"
onclick="previewQuestion()">
👁 Preview
</button>

<button class="edit-btn">
✏ Edit
</button>

<button class="delete-btn">
🗑 Delete
</button>

</div>
`;

}

getEl("popup").classList.add("show");

};

/* ================= PREVIEW ================= */
window.previewQuestion=()=>{

const ans =
getCorrectIndex(selectedQuestion);

let html="";

(selectedQuestion.options || [])
.forEach((op,i)=>{

html += `
<div class="option-box ${
i===ans ? "correct":""
}">

${String.fromCharCode(65+i)}.
${op}

${i===ans ? " ✅ Correct":""}

</div>
`;

});

getEl("popupContent").innerHTML=html;

};

/* ================= VIEW ALL ================= */
window.viewAllQuestions=()=>{

let html="";
let list=[];

allQuestions.forEach(q=>{

const levels=[
q.subject || "",
q.chapter || "",
q.topic || ""
].filter(v=>v!=="");

let ok=true;

for(let i=0;i<currentPath.length;i++){

if(levels[i]!==currentPath[i]){
ok=false;
break;
}

}

if(ok && levels.length===currentPath.length){
list.push(q);
}

});

list.forEach((q,no)=>{

const ans =
getCorrectIndex(q);

html += `
<div class="all-box">

<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options || []).forEach((op,i)=>{

html += `
<div class="option-box ${
i===ans ? "correct":""
}">

${String.fromCharCode(65+i)}.
${op}

${i===ans ? " ✅ Correct":""}

</div>
`;

});

html += `</div>`;

});

getEl("popupQuestion").innerText=
"All Questions Preview";

getEl("popupContent").innerHTML=
html;

getEl("popup").classList.add("show");

};

/* ================= CLOSE ================= */
window.closePopup=()=>{

getEl("popup").classList.remove("show");

};
