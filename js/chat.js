import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const friendId = params.get("uid");

let currentUser;
let selectedMsgId = null;

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) location.href = "index.html";

    currentUser = user;

    loadFriend();
    loadMessages();
});

/* FRIEND */
async function loadFriend() {

    let snap = await getDoc(doc(db,"users",friendId));
    let data = snap.data();

    chatName.innerText = data.name;

    onSnapshot(doc(db,"users",friendId), s=>{
        let d = s.data();
        status.innerText = d.online ? "Online" : "Offline";
        status.className = d.online ? "online" : "";
    });
}

/* CHAT ID */
function chatId() {
    return [currentUser.uid, friendId].sort().join("_");
}

/* SEND MESSAGE */
window.sendMsg = async () => {

    let text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db,"messages"), {
        chatId: chatId(),
        sender: currentUser.uid,
        text,
        time: Date.now(),
        pinned:false
    });

    msgInput.value = "";
};

/* ENTER KEY SEND */
msgInput.addEventListener("keypress", (e)=>{
    if(e.key === "Enter"){
        sendMsg();
    }
});

/* FORMAT TIME */
function formatTime(t){
    let d = new Date(t);
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2,'0');
}

/* LOAD */
function loadMessages(){

    onSnapshot(
        query(collection(db,"messages"), where("chatId","==",chatId())),
        snap=>{

            let msgs=[];
            snap.forEach(d=>msgs.push({id:d.id,...d.data()}));

            msgs.sort((a,b)=>a.time-b.time);

            let html="";

            msgs.forEach(m=>{

                let cls = m.sender === currentUser.uid ? "me":"other";

                html+=`
                <div class="msg ${cls}" onclick="selectMsg('${m.id}')">
                    ${m.text}
                    <div class="time">${formatTime(m.time)}</div>
                </div>`;
            });

            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    );
}

/* SELECT MESSAGE */
window.selectMsg = (id)=>{
    selectedMsgId = id;

    let choice = prompt("Type:\n1 = Delete\n2 = Pin");

    if(choice === "1"){
        deleteOptions();
    }
    else if(choice === "2"){
        pinMsg();
    }
};

/* DELETE OPTIONS */
async function deleteOptions(){

    let choice = prompt("1 = Delete for me\n2 = Delete for everyone");

    if(choice === "1"){
        await deleteDoc(doc(db,"messages",selectedMsgId));
    }

    if(choice === "2"){
        await updateDoc(doc(db,"messages",selectedMsgId),{
            text:"🚫 Message deleted"
        });
    }
}

/* PIN MESSAGE */
async function pinMsg(){

    await updateDoc(doc(db,"messages",selectedMsgId),{
        pinned:true
    });

    alert("Pinned 📌");
}
