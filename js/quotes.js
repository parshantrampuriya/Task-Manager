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

/* attach button */
attachEvents();

/* load data */
loadQuotes();
loadFriends();   // 🔥 NEW

});

});

/* ================= UI ================= */
function setupUI(){

const addSection = getEl("addSection");
const title = getEl("pageTitle");

if(viewUid !== currentUser.uid){

if(addSection) addSection.style.display = "none";
if(title) title.innerText = "👤 Friend Thoughts";

}else{

if(title) title.innerText = "✨ My Thoughts";

}

}

/* ================= BUTTON ================= */
function attachEvents(){

const btn = getEl("addQuoteBtn");

if(!btn) return;

btn.onclick = null;
btn.addEventListener("click", addQuote);

}

/* ================= ADD ================= */
async function addQuote(){

const input = getEl("quoteInput");
const text = input.value.trim();

if(!text){
toast("Write something");
return;
}

await addDoc(collection(db,"quotes"),{
uid: currentUser.uid,
text,
createdAt: Date.now(),
updatedAt: Date.now()
});

input.value = "";

toast("Saved ✨");

loadQuotes();

}

/* ================= LOAD QUOTES ================= */
async function loadQuotes(){

const snap = await getDocs(
query(collection(db,"quotes"),
where("uid","==",viewUid))
);

let arr = [];

snap.forEach(d=>{
arr.push({id:d.id, ...d.data()});
});

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

getEl("quoteList").innerHTML = html || "No thoughts yet";

}

/* ================= FRIENDS LIST ================= */
async function loadFriends(){

const wrap = getEl("friendThoughts");

if(!wrap) return;

const snap = await getDocs(collection(db,"friends"));

let html = "";

for(const d of snap.docs){

let users = d.data().users || [];

if(!users.includes(currentUser.uid)) continue;

let fid = users.find(x=>x!==currentUser.uid);

html += `
<div class="friend-card"
onclick="openFriendThought('${fid}')">
👤 Friend
</div>
`;

}

wrap.innerHTML = html || "No friends";

}

/* ================= OPEN FRIEND ================= */
window.openFriendThought = (uid)=>{
location.href = "quotes.html?viewUser=" + uid;
};

/* ================= EDIT ================= */
window.openEdit = (id,text)=>{

editId = id;

const val = decodeURIComponent(text);

/* custom popup instead of prompt */
const newText = prompt("Edit your thought:", val);

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

const ok = confirm("Delete this thought?");
if(!ok) return;

await deleteDoc(doc(db,"quotes",id));

toast("Deleted");
loadQuotes();

};

/* ================= TOAST ================= */
function toast(msg){

const t = getEl("toast");

if(!t) return;

t.innerText = msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}