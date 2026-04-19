// js/results-history.js

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs
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

snap.forEach(doc=>{

const d=doc.data();

if(d.uid===currentUser.uid){

allResults.push({
id:doc.id,
...d
});

}

});

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
(x.testName || "Untitled Test")
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

/* html */
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

const name=
r.testName ||
"Untitled Test";

html += `
<div class="card">

<div class="test-name">
${name}
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
