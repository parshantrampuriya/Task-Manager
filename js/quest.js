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
let taskQuestId=null;

/* ================= AUTH ================= */
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

/* ================= DEFAULT DATE ================= */
function setToday(){

const today=new Date().toISOString().split("T")[0];

if(getEl("questDate")){
getEl("questDate").value=today;
}

if(getEl("taskDate")){
getEl("taskDate").value=today;
}

}

/* ================= NAVIGATION ================= */
window.goMyPage=()=>{
location.href="quest.html";
};

/* ================= ADD QUEST ================= */
window.addQuest=async()=>{

let text=getEl("questInput").value.trim();
let date=getEl("questDate").value;

if(!text) return toast("Enter text");

await addDoc(collection(db,"quest"),{
uid:currentUser.uid,
text:text,
date:date,
status:"Pending",
createdAt:Date.now()
});

getEl("questInput").value="";

toast("Saved ✅");

loadQuest();

};

/* ================= FRIENDS ================= */
async function loadFriends(){

const snap=await getDocs(collection(db,"friends"));

let html="";

for(const d of snap.docs){

let users=d.data().users || [];

if(!users.includes(currentUser.uid)) continue;

let fid=users.find(x=>x!==currentUser.uid);

let u=await getDoc(doc(db,"users",fid));

let name="Friend";

if(u.exists()){
name=u.data().name || u.data().email || "Friend";
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
location.href="quest.html?uid="+uid+"&t="+Date.now();
};

/* ================= LOAD QUEST ================= */
async function loadQuest(){

const snap=await getDocs(
query(
collection(db,"quest"),
where("uid","==",viewUid)
)
);

let arr=[];

snap.forEach(d=>{
arr.push({
id:d.id,
...d.data()
});
});

/* latest first */
arr.sort((a,b)=>b.createdAt-a.createdAt);

let html="";
let lastDate="";

let added=0;
let solved=0;
let pending=0;

arr.forEach(x=>{

added++;

if(x.status==="Solved"){
solved++;
}else{
pending++;
}

if(lastDate!==x.date){

html+=`
<div class="date-head">
${x.date}
</div>
`;

lastDate=x.date;
}

html+=`
<div class="quest-card">

<div class="q-left">

<div class="q-text">
${x.text}
</div>

<div class="tag ${tagClass(x.status)}">
${x.status}
</div>

</div>

<div class="q-actions">

<button title="Google Search"
onclick="googleSearch('${escapeText(x.text)}')">🔍</button>

<button title="YouTube Search"
onclick="youtubeSearch('${escapeText(x.text)}')">▶️</button>

<button title="Ask ChatGPT"
onclick="chatAsk('${escapeText(x.text)}')">🤖</button>

<button title="Move To Insight"
onclick="toInsight('${x.id}','${escapeText(x.text)}')">🧠</button>

<button title="Convert To Task"
onclick="openTaskPopup('${x.id}','${escapeText(x.text)}')">📋</button>

<button title="Edit"
onclick="openEdit('${x.id}','${escapeText(x.text)}','${x.date}','${x.status}')">✏️</button>

<button title="Delete"
onclick="openDelete('${x.id}')">🗑️</button>

</div>

</div>
`;

});

getEl("questList").innerHTML=
html || "No quest found.";

if(getEl("totalAdded"))
getEl("totalAdded").innerText=added;

if(getEl("totalSolved"))
getEl("totalSolved").innerText=solved;

if(getEl("totalPending"))
getEl("totalPending").innerText=pending;

}

/* ================= TAG ================= */
function tagClass(v){

if(v==="Solved") return "learned";

return "pending";

}

/* ================= SEARCH ================= */
window.googleSearch=t=>{
window.open(
"https://www.google.com/search?q="+decodeURIComponent(t),
"_blank"
);
};

window.youtubeSearch=t=>{
window.open(
"https://www.youtube.com/results?search_query="+decodeURIComponent(t),
"_blank"
);
};

window.chatAsk=t=>{
window.open(
"https://chat.openai.com/",
"_blank"
);
};

/* ================= TO INSIGHT ================= */
window.toInsight=(id,t)=>{

let ok=confirm("Send to Insights?");

if(!ok) return;

moveQuestToInsight(id,decodeURIComponent(t));

};

async function moveQuestToInsight(id,text){

const today=new Date().toISOString().split("T")[0];

await addDoc(collection(db,"insights"),{
uid:currentUser.uid,
text:text,
date:today,
createdAt:Date.now(),
source:"quest"
});

await deleteDoc(doc(db,"quest",id));

toast("Moved To Insights 🧠");

loadQuest();

}

/* ================= TASK POPUP ================= */
window.openTaskPopup=(id,text)=>{

taskQuestId=id;

getEl("taskText").innerText=
decodeURIComponent(text);

getEl("taskPopup")
.classList.add("show");

};

window.closeTaskPopup=()=>{

getEl("taskPopup")
.classList.remove("show");

};

window.confirmTask=async()=>{

const date=getEl("taskDate").value;
const time=getEl("taskTime").value || "";

if(!date){
toast("Select date");
return;
}

const qSnap=await getDoc(
doc(db,"quest",taskQuestId)
);

if(!qSnap.exists()) return;

const qData=qSnap.data();

await addDoc(collection(db,"tasks"),{
uid:currentUser.uid,
text:qData.text,
date:date,
time:time,
done:false,
fromQuest:true,
questId:taskQuestId,
createdAt:Date.now()
});

closeTaskPopup();

toast("Added To Tasks 📋");

};

/* ================= EDIT ================= */
window.openEdit=(id,text,date,status)=>{

editId=id;

getEl("editText").value=
decodeURIComponent(text);

getEl("editDate").value=date;

getEl("editStatus").value=status;

getEl("editPopup")
.classList.add("show");

};

window.closeEdit=()=>{
getEl("editPopup").classList.remove("show");
};

window.saveEdit=async()=>{

let status=getEl("editStatus").value;
let text=getEl("editText").value.trim();
let date=getEl("editDate").value;

if(status==="Solved"){

await addDoc(collection(db,"insights"),{
uid:currentUser.uid,
text:text,
date:new Date().toISOString().split("T")[0],
createdAt:Date.now(),
source:"quest-direct"
});

await deleteDoc(doc(db,"quest",editId));

closeEdit();
toast("Solved → Insights 🧠");
loadQuest();
return;
}

await updateDoc(doc(db,"quest",editId),{
text:text,
date:date,
status:status
});

closeEdit();
toast("Updated ✅");
loadQuest();

};

/* ================= DELETE ================= */
window.openDelete=id=>{

deleteId=id;

getEl("deletePopup")
.classList.add("show");

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

/* ================= HELPERS ================= */
function escapeText(t){
return encodeURIComponent(t);
}

function toast(msg){

let t=getEl("toast");

if(!t) return;

t.innerText=msg;
t.classList.add("show");

setTimeout(()=>{
t.classList.remove("show");
},1800);

}
