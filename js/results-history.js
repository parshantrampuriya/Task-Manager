import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
const getEl=(id)=>document.getElementById(id);
let currentUser=null; let allResults=[];
onAuthStateChanged(auth, async(user)=>{
 if(!user){location.href='index.html';return;}
 currentUser=user; await loadResults();
});
async function loadResults(){
 const snap=await getDocs(collection(db,'results'));
 allResults=[];
 snap.forEach(d=>{const x=d.data(); if(x.uid===currentUser.uid) allResults.push({id:d.id,...x});});
 renderResults();
}
window.renderResults=()=>{
 let arr=[...allResults];
 const txt=getEl('searchBox').value.trim().toLowerCase();
 if(txt) arr=arr.filter(x=>(x.testName||'').toLowerCase().includes(txt));
 const sort=getEl('sortBox').value;
 if(sort==='new') arr.sort((a,b)=>(b.submittedAt||0)-(a.submittedAt||0));
 if(sort==='high') arr.sort((a,b)=>(b.score||0)-(a.score||0));
 if(sort==='low') arr.sort((a,b)=>(a.score||0)-(b.score||0));
 let html='';
 arr.forEach(r=>{
 const total=Number(r.totalMarks||0); const score=Number(r.score||0);
 const acc=total>0?((score/total)*100).toFixed(1):0;
 html+=`<div class='card'>
 <div class='title'>${r.testName||'Test Result'}</div>
 <div class='meta'>Score: ${score} / ${total}<br>Accuracy: ${acc}%<br>Date: ${new Date(r.submittedAt||Date.now()).toLocaleDateString()}</div>
 <div class='btns'>
 <button class='btn secondary' onclick="location.href='result.html?id=${r.testId}'">View Result</button>
 <button class='btn primary' onclick="location.href='result.html?id=${r.testId}&print=1'">Download PDF</button>
 </div></div>`;
 });
 getEl('resultList').innerHTML=html||"<div class='empty'>No results found.</div>";
}
