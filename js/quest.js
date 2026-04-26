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
getDoc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl=id=>document.getElementById(id);

let currentUser=null;
let viewUid=null;
let editId=null;
let deleteId=null;

onAuthStateChanged(auth,async(user)=>{

if(!user){
location.href="index.html";
return;
}

currentUser=user;

const params=new URLSearchParams(location.search);
viewUid=params.get("uid") || user.uid;

if(viewUid!==user.uid){
getEl("pageTitle").innerText="👤 Friend Quest";
getEl("addSection").style.display="none";
}else{
getEl("pageTitle").innerText="❓ My Quest";
}

setToday();
await loadFriends();
await loadQuest();

});

function setToday(){
getEl("questDate").value=
new Date().toISOString().split("T")[0];
}

window.goMyPage=()=>{
location.href="quest.html";
};

window.addQuest=async()=>{

let text=getEl("questInput").value.trim();
let date=getEl("questDate").value;
let status=getEl("questStatus").value;

if(!text) return toast("Enter text");

await addDoc(collection(db,"quest"),{
uid:currentUser.uid,
text,
date,
status,
createdAt:Date.now()
});

getEl("questInput").value="";
toast("Saved ✅");
loadQuest();

};

async function loadFriends(){

const snap=await getDocs(collection(db,"friends"));
let html="";

for(const d of snap.docs){

let users=d.data().users || [];

if(!users.includes(currentUser.uid))
continue;

let fid=users.find(x=>x!==currentUser.uid);

let u=await getDoc(doc(db,"users",fid));
let name="Friend";

if(u.exists()){
name=u.data().name || "Friend";
}

html+=`
<div class="friend-card"
onclick="openFriend('${fid}')">
👤 ${name}
</div>
`;

}

getEl("friendListMini").innerHTML=
html || "No friends";

}

window.openFriend=(uid)=>{
location.href="quest.html?uid="+uid;
};

async function loadQuest(){

const snap=await getDocs(
query(collection(db,"quest"),
where("uid","==",viewUid))
);

let arr=[];

snap.forEach(d=>{
arr.push({id:d.id,...d.data()});
});

arr.sort((a,b)=>b.createdAt-a.createdAt);

let html="";
let lastDate="";

let added=0,solved=0,pending=0;

arr.forEach(x=>{

added++;

if(x.status==="Learned" || x.status==="Closed")
solved++;
else
pending++;

if(lastDate!==x.date){
html+=`<div class="date-head">${x.date}</div>`;
lastDate=x.date;
}

html+=`
<div class="quest-card">

<div class="q-left">
<div class="q-text">${x.text}</div>
<div class="tag ${tagClass(x.status)}">${x.status}</div>
</div>

<div class="q-actions">
<button title="Google Search"
onclick="googleSearch('${escapeText(x.text)}')">🔍</button>

<button title="YouTube Search"
onclick="youtubeSearch('${escapeText(x.text)}')">▶️</button>

<button title="Ask ChatGPT"
onclick="chatAsk('${escapeText(x.text)}')">🤖</button>

<button title="Convert To Insight"
onclick="toInsight('${escapeText(x.text)}')">🧠</button>

<button title="Convert To Task"
onclick="toTask('${escapeText(x.text)}')">📋</button>

<button title="Edit"
onclick="openEdit('${x.id}','${escapeText(x.text)}','${x.date}','${x.status}')">✏️</button>

<button title="Delete"
onclick="openDelete('${x.id}')">🗑️</button>
`
:""
}

</div>

</div>
`;

});

getEl("questList").innerHTML=
html || "No quest found.";

getEl("totalAdded").innerText=added;
getEl("totalSolved").innerText=solved;
getEl("totalPending").innerText=pending;

}

function tagClass(v){

if(v==="Pending") return "pending";
if(v==="Searching") return "searching";
if(v==="Asked Someone") return "asked";
if(v==="Learned") return "learned";
return "closed";

}

window.googleSearch=t=>{
window.open("https://www.google.com/search?q="+decodeURIComponent(t));
};

window.youtubeSearch=t=>{
window.open("https://www.youtube.com/results?search_query="+decodeURIComponent(t));
};

window.chatAsk=t=>{
window.open("https://chat.openai.com/");
};

window.toInsight=t=>{
toast("Copy & add to Insights");
};

window.toTask=t=>{
toast("Copy & add to Tasks");
};

window.openEdit=(id,text,date,status)=>{

editId=id;

getEl("editText").value=decodeURIComponent(text);
getEl("editDate").value=date;
getEl("editStatus").value=status;

getEl("editPopup").classList.add("show");

};

window.closeEdit=()=>{
getEl("editPopup").classList.remove("show");
};

window.saveEdit=async()=>{

await updateDoc(doc(db,"quest",editId),{
text:getEl("editText").value.trim(),
date:getEl("editDate").value,
status:getEl("editStatus").value
});

closeEdit();
toast("Updated");
loadQuest();

};

window.openDelete=id=>{
deleteId=id;
getEl("deletePopup").classList.add("show");
};

window.closeDelete=()=>{
getEl("deletePopup").classList.remove("show");
};

window.confirmDelete=async()=>{

await deleteDoc(doc(db,"quest",deleteId));

closeDelete();
toast("Deleted");
loadQuest();

};

function escapeText(t){
return encodeURIComponent(t);
}

function toast(msg){

let t=getEl("toast");
t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
