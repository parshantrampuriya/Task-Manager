/* ================= UPDATED view-question.js ================= */
/* OLD FEATURES KEPT + PREMIUM POPUPS + FIXED CORRECT OPTION */

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
const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allQuestions=[];
let currentPath=[];
let selectedQuestion=null;
let holdTimer=null;
let confirmAction=null;

/* ================= FRIEND MODE ================= */
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

getEl("sidebar").classList.toggle("active");

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

/* ================= ANSWER ================= */
function getCorrectIndex(q){

if(q.answerIndex!==undefined){
return idx(q.answerIndex);
}

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

if(q.answer!==undefined) return idx(q.answer);
if(q.correct_option!==undefined) return idx(q.correct_option);
if(q.correctAnswer!==undefined) return idx(q.correctAnswer);
if(q.correct!==undefined) return idx(q.correct);

return 0;

}

/* ================= LOAD ================= */
async function loadAllQuestions(){

const uid=(readOnly && friendUid)
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
q.subject||"",
q.chapter||"",
q.topic||""
].filter(x=>x!="");

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

folders.forEach(name=>{

html+=`
<div class="file-item folder"
onclick="openFolder('${safe(name)}')"
onmousedown="startHold('${safe(name)}')"
ontouchstart="startHold('${safe(name)}')"
onmouseup="cancelHold()"
ontouchend="cancelHold()">

<div class="file-icon">📁</div>
<div class="file-name">${name}</div>

</div>
`;

});

questions.forEach((q,no)=>{

html+=`
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

fileArea.innerHTML=html;

viewBtn.style.display=
questions.length>0
? "inline-flex"
: "none";

}

/* ================= SAFE ================= */
function safe(t){
return t.replace(/'/g,"\\'");
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

window.startHold=(name)=>{

if(readOnly) return;

holdTimer=setTimeout(()=>{
showFolderPopup(name);
},1000);

};

window.cancelHold=()=>{

clearTimeout(holdTimer);

};

function showFolderPopup(name){

getEl("popupQuestion").innerText="📁 "+name;

getEl("popupContent").innerHTML=`
<div class="popup-btn-row">

<button class="edit-btn"
onclick="renameFolder('${safe(name)}')">
✏ Rename Folder
</button>

<button class="delete-btn"
onclick="askDeleteFolder('${safe(name)}')">
🗑 Delete Folder
</button>

</div>
`;

getEl("popup").classList.add("show");

}

window.renameFolder=async(oldName)=>{

const newName=prompt("Enter new folder name");

if(!newName) return;

for(const q of allQuestions){

let levels=[
q.subject||"",
q.chapter||"",
q.topic||""
];

if(levels[currentPath.length]===oldName){

levels[currentPath.length]=newName;

await updateDoc(
doc(db,"questionBank",q.id),
{
subject:levels[0],
chapter:levels[1],
topic:levels[2]
}
);

}

}

closePopup();
await loadAllQuestions();
showToast("Folder Renamed");

};

window.askDeleteFolder=(name)=>{

closePopup();

showConfirm(
"Delete Folder",
"Delete folder and all questions?",
async()=>{

for(const q of allQuestions){

let levels=[
q.subject||"",
q.chapter||"",
q.topic||""
];

if(levels[currentPath.length]===name){

await deleteDoc(
doc(db,"questionBank",q.id)
);

}

}

await loadAllQuestions();
showToast("Folder Deleted");

});

};

/* ================= QUESTION ================= */
window.openQuestion=(id)=>{

selectedQuestion=
allQuestions.find(x=>x.id===id);

if(!selectedQuestion) return;

getEl("popupQuestion").innerText=
selectedQuestion.question;

let html=`
<div class="popup-btn-row">

<button class="preview-btn"
onclick="previewQuestion()">
👁 Preview
</button>
`;

if(!readOnly){

html+=`
<button class="edit-btn"
onclick="editQuestion()">
✏ Edit
</button>

<button class="delete-btn"
onclick="deleteQuestionAsk()">
🗑 Delete
</button>
`;

}

html+=`</div>`;

getEl("popupContent").innerHTML=html;
getEl("popup").classList.add("show");

};

/* ================= PREVIEW ================= */
window.previewQuestion=()=>{

const ans=getCorrectIndex(selectedQuestion);

let html=`<h3>${selectedQuestion.question}</h3>`;

(selectedQuestion.options||[]).forEach((op,i)=>{

html+=`
<div class="option-box ${i===ans?"correct":""}">
${String.fromCharCode(65+i)}. ${op}
${i===ans?" ✅ Correct":""}
</div>
`;

});

getEl("popupContent").innerHTML=html;

};

/* ================= EDIT ================= */
window.editQuestion=()=>{

const ans=getCorrectIndex(selectedQuestion);

let html=`
<label>Question</label>
<textarea id="editQ">${selectedQuestion.question}</textarea>
`;

(selectedQuestion.options||[]).forEach((op,i)=>{

html+=`
<div class="edit-opt">

<input type="radio"
name="rightAns"
value="${i}"
${i===ans?"checked":""}>

<input id="op${i}"
value="${op}"
placeholder="Option ${i+1}">

</div>
`;

});

html+=`
<button class="save-btn"
onclick="saveQuestionEdit()">
💾 Save Changes
</button>
`;

getEl("popupContent").innerHTML=html;

};

window.saveQuestionEdit=async()=>{

let arr=[];

for(let i=0;i<4;i++){
arr.push(getEl("op"+i).value.trim());
}

const right=
Number(
document.querySelector(
"input[name='rightAns']:checked"
).value
);

await updateDoc(
doc(db,"questionBank",selectedQuestion.id),
{
question:getEl("editQ").value.trim(),
options:arr,
answerIndex:right,
answer:arr[right]
}
);

closePopup();
await loadAllQuestions();
showToast("Updated");

};

/* ================= DELETE QUESTION ================= */
window.deleteQuestionAsk=()=>{

showConfirm(
"Delete Question",
"Are you sure you want to delete this question?",
async()=>{

await deleteDoc(
doc(db,"questionBank",selectedQuestion.id)
);

closePopup();
await loadAllQuestions();
showToast("Deleted");

});

};

/* ================= VIEW ALL ================= */
window.viewAllQuestions=()=>{

let list=[];

allQuestions.forEach(q=>{

const levels=[
q.subject||"",
q.chapter||"",
q.topic||""
].filter(x=>x!="");

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

let html="";

list.forEach((q,no)=>{

const ans=getCorrectIndex(q);

html+=`
<div class="all-box">

<h3>Q${no+1}. ${q.question}</h3>
`;

(q.options||[]).forEach((op,i)=>{

html+=`
<div class="option-box ${i===ans?"correct":""}">
${String.fromCharCode(65+i)}. ${op}
${i===ans?" ✅ Correct":""}
</div>
`;

});

html+=`</div>`;

});

getEl("popupQuestion").innerText="All Questions Preview";
getEl("popupContent").innerHTML=html;
getEl("popup").classList.add("show");

};

/* ================= CONFIRM ================= */
function showConfirm(title,text,fn){

confirmAction=fn;

getEl("confirmTitle").innerText=title;
getEl("confirmText").innerText=text;

getEl("confirmPopup")
.classList.add("show");

}

getEl("confirmYesBtn").onclick=async()=>{

if(confirmAction){
await confirmAction();
}

closeConfirmPopup();

};

window.closeConfirmPopup=()=>{

getEl("confirmPopup")
.classList.remove("show");

};

/* ================= CLOSE ================= */
window.closePopup=()=>{

getEl("popup").classList.remove("show");

};
