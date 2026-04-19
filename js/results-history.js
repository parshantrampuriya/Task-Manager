// js/results-history.js

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=(id)=>document.getElementById(id);

let currentUser=null;
let allResults=[];

/* auth */
onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

await loadResults();

});

/* load */
async function loadResults(){

const snap=
await getDocs(collection(db,"results"));

allResults=[];

for(const item of snap.docs){

const d=item.data();

if(d.uid!==currentUser.uid)
continue;

/* if result has no testName then fetch from tests table */
let testName =
d.testName || "";

if(!testName && d.testId){

try{

const testSnap =
await getDoc(
doc(db,"tests",d.testId)
);

if(testSnap.exists()){

testName =
testSnap.data().testName || "";

}

}catch(err){}

}

allResults.push({
id:item.id,
...d,
testName:
testName || "Untitled Test"
});

}

renderResults();

}

/* render */
window.renderResults=()=>{

let arr=[...allResults];

const txt=
getEl("searchBox").value
.trim()
.toLowerCase();

if(txt){

arr=arr.filter(x=>
(x.testName || "")
.toLowerCase()
.includes(txt)
);

}

/* sort */
const sort=
getEl("sortBox").value;

if(sort==="new"){
arr.sort((a,b)=>
(b.submittedAt||0)-
(a.submittedAt||0)
);
}

if(sort==="high"){
arr.sort((a,b)=>
(b.score||0)-
(a.score||0)
);
}

if(sort==="low"){
arr.sort((a,b)=>
(a.score||0)-
(b.score||0)
);
}

let html="";

arr.forEach(r=>{

const score=
Number(r.score||0);

const total=
Number(r.totalMarks||0);

const acc=
total>0
? ((score/total)*100).toFixed(1)
: 0;

html += `
<div class="card">

<div class="test-name">
${r.testName}
</div>

<div class="meta">
Score: ${score} / ${total}<br>
Accuracy: ${acc}%<br>
Date: ${
new Date(
r.submittedAt||Date.now()
).toLocaleDateString()
}
</div>

<div class="btn-row">

<button
type="button"
class="btn btn-view"
onclick="viewResult('${r.testId}')">
View Result
</button>

<button
type="button"
class="btn btn-pdf"
onclick="downloadPdf('${r.testId}')">
Download PDF
</button>

</div>

</div>
`;

});

if(!html){

html=`
<div class="empty">
No Results Found
</div>
`;

}

getEl("resultList").innerHTML=
html;

};

/* buttons */
window.viewResult=(id)=>{

location.href=
"result.html?id="+id;

};

window.downloadPdf=(id)=>{

location.href=
"result.html?id="+id+"&print=1";

};
