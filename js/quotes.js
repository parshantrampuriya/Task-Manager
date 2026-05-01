import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
addDoc,
getDocs,
query,
where,
doc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = id => document.getElementById(id);

let currentUser = null;
let viewUid = null;
let editId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

/* view mode */
const params = new URLSearchParams(location.search);
viewUid = params.get("viewUser") || user.uid;

/* UI setup */
setupUI();

/* attach button AFTER DOM READY */
attachEvents();

/* load data */
loadQuotes();

});

});

/* ================= UI ================= */
function setupUI(){

const addSection = getEl("addSection");
const title = getEl("pageTitle");

/* friend mode */
if(viewUid !== currentUser.uid){

if(addSection) addSection.style.display = "none";
if(title) title.innerText = "👤 Friend Thoughts";

}else{

if(title) title.innerText = "✨ My Thoughts";

}

}

/* ================= BUTTON FIX ================= */
function attachEvents(){

const btn = getEl("addQuoteBtn");

if(!btn){
console.log("❌ Button not found");
return;
}

/* remove old (safe rebind) */
btn.onclick = null;

/* bind */
btn.addEventListener("click", addQuote);

console.log("✅ Button connected");

}

/* ================= ADD ================= */
async function addQuote(){

console.log("🔥 Click detected");

const input = getEl("quoteInput");

if(!input){
console.log("❌ Input not found");
return;
}

const text = input.value.trim();

if(!text){
toast("Write something");
return;
}

try{

await addDoc(collection(db,"quotes"),{
uid: currentUser.uid,
text,
createdAt: Date.now(),
updatedAt: Date.now()
});

input.value = "";

toast("Saved ✨");

loadQuotes();

}catch(err){
console.error(err);
toast("Error saving");
}

}

/* ================= LOAD ================= */
async function loadQuotes(){

const snap = await getDocs(
query(collection(db,"quotes"),
where("uid","==",viewUid))
);

let arr = [];

snap.forEach(d=>{
arr.push({id:d.id, ...d.data()});
});

/* latest first */
arr.sort((a,b)=>b.createdAt-a.createdAt);

let html = "";

arr.forEach(q=>{

html += `
<div class="quote-card">

<div class="quote-text">
${(q.text || "").replace(/\n/g,"<br>")}
</div>

<div class="quote-time">
🕒 ${new Date(q.createdAt).toLocaleDateString()}
</div>

${
viewUid === currentUser.uid
? `
<div class="actions">
<button onclick="openEdit('${q.id}','${encodeURIComponent(q.text)}')">✏️</button>
<button onclick="deleteQuote('${q.id}')">🗑️</button>
</div>
`
: ""
}

</div>
`;

});

const list = getEl("quoteList");

if(list){
list.innerHTML = html || "No thoughts yet";
}

}

/* ================= EDIT ================= */
window.openEdit = (id,text)=>{

editId = id;

let val = decodeURIComponent(text);

let newText = prompt("Edit your thought:", val);

if(newText !== null){
updateQuote(newText);
}

};

async function updateQuote(text){

await updateDoc(doc(db,"quotes",editId),{
text,
updatedAt: Date.now()
});

toast("Updated ✏️");
loadQuotes();

}

/* ================= DELETE ================= */
window.deleteQuote = async(id)=>{

let ok = confirm("Delete this thought?");
if(!ok) return;

await deleteDoc(doc(db,"quotes",id));

toast("Deleted");
loadQuotes();

};

/* ================= TOAST ================= */
function toast(msg){

let t = getEl("toast");

if(!t) return;

t.innerText = msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}