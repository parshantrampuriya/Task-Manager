/* ================= UPDATED view-question.js ================= */
/* FIXED: folder options + question preview + edit + delete */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
doc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser=null;
let allQuestions=[];
let currentPath=[];
let selectedQuestion=null;

const params=new URLSearchParams(location.search);
const friendUid=params.get("uid");

let readOnly=false;

/* ================= AUTH ================= */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

if(friendUid && friendUid!==user.uid){
readOnly=true;
}

await loadAllQuestions();

});

/* ================= MENU ================= */
window.toggleSidebar=()=>{

getEl("sidebar")?.classList.toggle("active");

};

/* ================= LOAD ================= */
async function loadAllQuestions(){

const uid=
(readOnly && friendUid)
? friendUid
: currentUser.uid;

const snap=await getDocs(
query(
collection(db,"questionBank"),
where("uid","==",uid)
)
);

allQuestions=[];

snap.forEach(d=>{

allQuestions.push({
id:d.id,
...d.data()
});

});

renderFiles();

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

/* ================= ANSWER INDEX ================= */
function getCorrectIndex(q){

if(q.answerIndex!==undefined)
return idx(q.answerIndex);

if(typeof q.answer==="string" && isNaN(q.answer)){

for(let i=0;i<(q.options||[]).length;i++){

if(
String(q.options[i]).trim().toLowerCase() ===
String(q.answer).trim().toLowerCase()
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

return 0;

}

/* ================= RENDER ================= */
function renderFiles(){

const area=getEl("fileArea");

let folders=[];
let questions=[];

allQuestions.forEach(q=>{

const levels=[
q.subject||"",
q.chapter||"",
q.topic||""
].filter(Boolean);

let ok=true;

for(let i=0;i<currentPath.length;i++){

if(levels[i]!==currentPath[i]){
ok=false;
break;
}

}

if(!ok) return;

if(levels.length>currentPath.length){

const next=levels[currentPath.length];

if(next && !folders.includes(next)){
folders.push(next);
}

}else{
questions.push(q);
}

});

let html="";

/* folders */
folders.forEach(name=>{

html += `
<div class="file-item folder">

<div onclick="openFolder('${name}')"
style="flex:1;cursor:pointer">

<div class="file-icon">📁</div>
<div class="file-name">${name}</div>

</div>

${
!readOnly
?
`
<button onclick="folderMenu('${name}')">
⋮
</button>
`
:""
}

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
html=`<div class="file-item">Empty Folder</div>`;
}

area.innerHTML=html;

getEl("pathText").innerText=
currentPath.length
? currentPath.join(" > ")
: "Home";

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

window.folderMenu=(name)=>{

const action=prompt(
`Folder: ${name}

1 = Open
2 = Rename
3 = Delete`
);

if(action==="1"){
openFolder(name);
}

if(action==="2"){
renameFolder(name);
}

if(action==="3"){
deleteFolder(name);
}

};

/* ================= RENAME FOLDER ================= */
window.renameFolder=async(oldName)=>{

const newName=prompt("New Folder Name");

if(!newName) return;

for(const q of allQuestions){

const levels=[
q.subject,
q.chapter,
q.topic
];

if(levels[currentPath.length]===oldName){

levels[currentPath.length]=newName;

await updateDoc(
doc(db,"questionBank",q.id),
{
subject:levels[0]||"",
chapter:levels[1]||"",
topic:levels[2]||""
}
);

}

}

await loadAllQuestions();

};

/* ================= DELETE FOLDER ================= */
window.deleteFolder=async(name)=>{

if(!confirm("Delete folder and all questions?"))
return;

for(const q of allQuestions){

const levels=[
q.subject,
q.chapter,
q.topic
];

if(levels[currentPath.length]===name){

await deleteDoc(
doc(db,"questionBank",q.id)
);

}

}

await loadAllQuestions();

};

/* ================= QUESTION ================= */
window.openQuestion=(id)=>{

selectedQuestion=
allQuestions.find(x=>x.id===id);

if(!selectedQuestion) return;

getEl("popupQuestion").innerText=
selectedQuestion.question;

getEl("popupContent").innerHTML=`

<button onclick="previewQuestion()">👁 Preview</button>

${
!readOnly
?
`
<button onclick="editQuestion()">✏ Edit</button>
<button onclick="deleteQuestion()">🗑 Delete</button>
`
:""
}

`;

getEl("popup").classList.add("show");

};

/* ================= PREVIEW ================= */
window.previewQuestion=()=>{

let html="";

const ans=getCorrectIndex(selectedQuestion);

(selectedQuestion.options||[])
.forEach((op,i)=>{

html += `
<div class="option-box ${i===ans?"correct":""}">
${String.fromCharCode(65+i)}. ${op}
${i===ans?" ✅ Correct":""}
</div>
`;

});

getEl("popupContent").innerHTML=html;

};

/* ================= EDIT QUESTION ================= */
window.editQuestion=async()=>{

const txt=prompt(
"Edit Question",
selectedQuestion.question
);

if(!txt) return;

await updateDoc(
doc(db,"questionBank",selectedQuestion.id),
{
question:txt
}
);

closePopup();
await loadAllQuestions();

};

/* ================= DELETE QUESTION ================= */
window.deleteQuestion=async()=>{

if(!confirm("Delete question?"))
return;

await deleteDoc(
doc(db,"questionBank",selectedQuestion.id)
);

closePopup();
await loadAllQuestions();

};

/* ================= VIEW ALL ================= */
window.viewAllQuestions=()=>{

let html="";

allQuestions.forEach((q,no)=>{

const levels=[
q.subject||"",
q.chapter||"",
q.topic||""
].filter(Boolean);

let ok=true;

for(let i=0;i<currentPath.length;i++){

if(levels[i]!==currentPath[i]){
ok=false;
break;
}

}

if(ok && levels.length===currentPath.length){

const ans=getCorrectIndex(q);

html += `<h3>Q${no+1}. ${q.question}</h3>`;

(q.options||[]).forEach((op,i)=>{

html += `
<div class="option-box ${i===ans?"correct":""}">
${String.fromCharCode(65+i)}. ${op}
${i===ans?" ✅ Correct":""}
</div>
`;

});

html += "<hr>";

}

});

getEl("popupQuestion").innerText="All Questions";
getEl("popupContent").innerHTML=html;
getEl("popup").classList.add("show");

};

/* ================= CLOSE ================= */
window.closePopup=()=>{

getEl("popup").classList.remove("show");

};
