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

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser = user;

const params = new URLSearchParams(location.search);
viewUid = params.get("viewUser") || user.uid;

if(viewUid !== user.uid){
getEl("addSection").style.display = "none";
}

loadQuotes();

});

/* ================= ADD ================= */
window.addQuote = async()=>{

const text = getEl("quoteInput").value.trim();

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

getEl("quoteInput").value = "";

toast("Saved ✨");

loadQuotes();

};

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

arr.sort((a,b)=>b.createdAt-a.createdAt);

let html = "";

arr.forEach(q=>{

html += `
<div class="quote-card">

<div class="quote-text">
${q.text.replace(/\n/g,"<br>")}
</div>

<div class="quote-time">
🕒 ${new Date(q.createdAt).toLocaleDateString()}
</div>

${
viewUid === currentUser.uid
? `
<div class="actions">

<button onclick="openEdit('${q.id}','${encodeURIComponent(q.text)}')">
✏️
</button>

<button onclick="deleteQuote('${q.id}')">
🗑️
</button>

</div>
`
: ""
}

</div>
`;

});

getEl("quoteList").innerHTML = html || "No thoughts yet";

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

t.innerText = msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}