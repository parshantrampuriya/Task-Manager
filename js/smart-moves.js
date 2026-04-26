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

const getEl=(id)=>document.getElementById(id);

let currentUser=null;

onAuthStateChanged(auth,(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;
setToday();
loadData();

});

function setToday(){
getEl("entryDate").value=
new Date().toISOString().split("T")[0];
}

window.addEntry=async()=>{

const text=
getEl("entryInput").value.trim();

const date=
getEl("entryDate").value;

if(!text) return toast("Enter smart move");

await addDoc(collection(db,"smartMoves"),{
uid:currentUser.uid,
text,
date,
createdAt:Date.now()
});

getEl("entryInput").value="";
toast("Saved ✅");
loadData();

};

async function loadData(){

const snap=await getDocs(
query(
collection(db,"smartMoves"),
where("uid","==",currentUser.uid)
)
);

let arr=[];

snap.forEach(d=>{
arr.push({id:d.id,...d.data()});
});

arr.sort((a,b)=>b.createdAt-a.createdAt);

let html="";

arr.forEach(x=>{

html+=`
<div class="entry-card">

<div class="entry-left">
<div>${x.text}</div>
<div class="entry-date">${x.date}</div>
</div>

<div class="entry-actions">
<button class="edit-btn"
onclick="editItem('${x.id}','${encodeURIComponent(x.text)}')">
Edit
</button>

<button class="del-btn"
onclick="deleteItem('${x.id}')">
Delete
</button>
</div>

</div>
`;

});

getEl("listBox").innerHTML=
html || "No smart moves yet.";

}

window.editItem=async(id,text)=>{

let val=prompt(
"Edit Smart Move",
decodeURIComponent(text)
);

if(!val) return;

await updateDoc(doc(db,"smartMoves",id),{
text:val.trim()
});

toast("Updated");
loadData();

};

window.deleteItem=async(id)=>{

if(!confirm("Delete this smart move?"))
return;

await deleteDoc(doc(db,"smartMoves",id));

toast("Deleted");
loadData();

};

function toast(msg){

const t=getEl("toast");

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1600);

}
