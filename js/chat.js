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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const friendId = params.get("uid");

let currentUser;

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    loadFriend();
    loadMessages();
    setOnline();
});

/* ONLINE STATUS */
async function setOnline() {

    await updateDoc(doc(db,"users",currentUser.uid), { online:true });

    window.addEventListener("beforeunload", async () => {
        await updateDoc(doc(db,"users",currentUser.uid), { online:false });
    });
}

/* LOAD FRIEND */
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

/* SEND */
window.sendMsg = async () => {

    let text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db,"messages"), {
        chatId: chatId(),
        sender: currentUser.uid,
        text,
        time: Date.now()
    });

    msgInput.value = "";
};

/* LOAD MESSAGES */
function loadMessages() {

    onSnapshot(
        query(collection(db,"messages"), where("chatId","==",chatId())),
        snap => {

            let msgs = [];

            snap.forEach(d => msgs.push(d.data()));

            msgs.sort((a,b)=>a.time-b.time);

            let html = "";

            msgs.forEach(m=>{
                let cls = m.sender === currentUser.uid ? "me":"other";

                html += `<div class="msg ${cls}">${m.text}</div>`;
            });

            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    );
}
