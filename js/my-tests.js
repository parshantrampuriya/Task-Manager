import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where,
doc,
getDoc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allTests = [];
let activeTab = "all";

let editingTest = null;
let deletingId = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;
await loadMyTests();

});

/* ================= SIDEBAR ================= */
window.toggleSidebar = ()=>{

const sidebar = getEl("sidebar");

if(sidebar){
sidebar.classList.toggle("active");
}

};

/* ================= TOAST ================= */
function showToast(msg){

const t = getEl("toast");

if(!t) return;

t.innerText = msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}

/* ================= LOAD TESTS ================= */
window.loadMyTests = async()=>{

const snap = await getDocs(
query(
collection(db,"tests"),
where("createdBy","==",currentUser.uid)
)
);

allTests = [];

snap.forEach(d=>{

allTests.push({
id:d.id,
...d.data()
});

});

renderTests();

};

/* ================= TAB ================= */
window.changeTab = (tab,btn)=>{

activeTab = tab;

document
.querySelectorAll(".tab-btn")
.forEach(x=>x.classList.remove("active"));

if(btn){
btn.classList.add("active");
}

renderTests();

};

window.searchTests = ()=>{
renderTests();
};

/* ================= STATUS ================= */
function getStatus(test){

const now = Date.now();

const start = Number(test.startAt || 0);
const end   = Number(test.endAt || 0);

if(end && now > end){
return "completed";
}

if(start && now < start){
return "draft";
}

return "active";

}

/* ================= RENDER ================= */
function renderTests(){

let arr = [...allTests];

/* filter */
if(activeTab !== "all"){

arr = arr.filter(x=>
getStatus(x)===activeTab
);

}

/* search */
const txt =
(getEl("searchBox")?.value || "")
.trim()
.toLowerCase();

if(txt){

arr = arr.filter(x=>
(x.testName || "")
.toLowerCase()
.includes(txt)
);

}

/* sort */
const sort =
getEl("sortBox")?.value || "new";

if(sort==="new"){
arr.sort((a,b)=>
(b.createdAt||0) -
(a.createdAt||0)
);
}

if(sort==="old"){
arr.sort((a,b)=>
(a.createdAt||0) -
(b.createdAt||0)
);
}

if(sort==="name"){
arr.sort((a,b)=>
(a.testName||"")
.localeCompare(b.testName||"")
);
}

/* stats */
setText("totalTests",allTests.length);

setText(
"activeTests",
allTests.filter(x=>
getStatus(x)==="active"
).length
);

let attempts = 0;

allTests.forEach(x=>{
attempts += Number(x.attemptCount || 0);
});

setText("attemptCount",attempts);

/* cards */
let html = "";

arr.forEach(test=>{

const status = getStatus(test);

const assigned =
(test.assignedTo || []).length;

const releaseBtn =
test.resultMode==="later" &&
!test.resultReleased
?
`
<button class="action-btn"
onclick="releaseResult('${test.id}')">
📢 Release Result
</button>
`
:"";

html += `
<div class="test-card">

<div class="test-top">

<div class="test-name">
${test.testName || "Untitled Test"}
</div>

<div class="status ${status}">
${cap(status)}
</div>

</div>

<div class="meta-grid">

<div class="meta-box">
<h4>Users</h4>
<p>${assigned}</p>
</div>

<div class="meta-box">
<h4>Attempts</h4>
<p>${test.attemptCount || 0}</p>
</div>

<div class="meta-box">
<h4>Marks</h4>
<p>${test.totalMarks || 0}</p>
</div>

<div class="meta-box">
<h4>Time</h4>
<p>${test.duration || 0} min</p>
</div>

</div>

<div class="action-row">

<button class="action-btn primary"
onclick="editTest('${test.id}')">
✏ Edit
</button>

<button class="action-btn"
onclick="openResults('${test.id}')">
📊 Results
</button>

<button class="action-btn"
onclick="duplicateTest('${test.id}')">
📄 Duplicate
</button>

<button class="action-btn"
onclick="assignTest('${test.id}')">
👥 Assign
</button>

${releaseBtn}

<button class="action-btn delete"
onclick="askDelete('${test.id}')">
🗑 Delete
</button>

</div>

</div>
`;

});

if(!html){

html = `
<div class="empty-box">
No tests found.
</div>
`;

}

const list = getEl("testList");

if(list){
list.innerHTML = html;
}

}

/* ================= RELEASE RESULT ================= */
window.releaseResult = async(id)=>{

await updateDoc(
doc(db,"tests",id),
{
resultReleased:true
}
);

showToast("Result Released ✅");

await loadMyTests();

};

/* ================= EDIT ================= */
window.editTest = async(id)=>{

const snap =
await getDoc(doc(db,"tests",id));

if(!snap.exists()) return;

editingTest = {
id,
...snap.data()
};

getEl("editArea").innerHTML = `

<label>Test Name</label>
<input id="eName"
value="${editingTest.testName || ""}">

<label>Duration</label>
<input id="eTime"
type="number"
value="${editingTest.duration || 0}">

<label>Total Marks</label>
<input id="eMarks"
type="number"
value="${editingTest.totalMarks || 0}">

<label>Negative %</label>
<input id="eNegative"
type="number"
value="${editingTest.negativeMarks || 0}">

<div class="popup-btn-row">

<button class="cancel-btn"
onclick="closeEditPopup()">
Cancel
</button>

<button class="save-btn"
onclick="saveEditTest()">
Save
</button>

</div>
`;

getEl("editPopup")
?.classList.add("show");

};

/* ================= SAVE EDIT ================= */
window.saveEditTest = async()=>{

await updateDoc(
doc(db,"tests",editingTest.id),
{
testName:getEl("eName").value.trim(),
duration:Number(getEl("eTime").value),
totalMarks:Number(getEl("eMarks").value),
negativeMarks:Number(getEl("eNegative").value)
}
);

closeEditPopup();

showToast("Updated ✅");

await loadMyTests();

};

/* ================= DELETE ================= */
window.askDelete = (id)=>{

deletingId = id;

getEl("deletePopup")
?.classList.add("show");

};

window.closeDeletePopup = ()=>{

getEl("deletePopup")
?.classList.remove("show");

};

window.closeEditPopup = ()=>{

getEl("editPopup")
?.classList.remove("show");

};

const delBtn = getEl("confirmDeleteBtn");

if(delBtn){

delBtn.onclick = async()=>{

if(!deletingId) return;

await deleteDoc(
doc(db,"tests",deletingId)
);

deletingId = null;

closeDeletePopup();

showToast("Deleted ✅");

await loadMyTests();

};

}

/* ================= OTHER ================= */
window.openResults = (id)=>{
location.href="admin-result.html?id="+id;
};

window.assignTest = (id)=>{
location.href="assign-test.html?id="+id;
};

window.duplicateTest = (id)=>{
location.href="create-test.html?copy="+id;
};

/* ================= HELPERS ================= */
function cap(t){
return t.charAt(0).toUpperCase() + t.slice(1);
}

function setText(id,val){

const el = getEl(id);

if(el){
el.innerText = val;
}

}
