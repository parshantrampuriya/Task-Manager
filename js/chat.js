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

/* ================= PARAMS ================= */
const params = new URLSearchParams(location.search);
const friendId = params.get("uid");

let currentUser;
let selectedMsgId = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) location.href = "index.html";

    currentUser = user;

    setOnline(true);

    loadFriend();
    loadMessages();

    // set offline when leave
    window.addEventListener("beforeunload", () => {
        setOnline(false);
    });
});

/* ================= ONLINE STATUS ================= */
async function setOnline(status){
    await updateDoc(doc(db,"users",currentUser.uid),{
        online: status
    });
}

/* ================= FRIEND ================= */
async function loadFriend() {

    let snap = await getDoc(doc(db,"users",friendId));
    let data = snap.data();

    chatName.innerText = data.name;

    // realtime status
    onSnapshot(doc(db,"users",friendId), s=>{
        let d = s.data();

        status.innerText = d.online ? "Online" : "Offline";
        status.style.color = d.online ? "#00ffcc" : "#aaa";
    });
}

/* ================= CHAT ID ================= */
function chatId() {
    return [currentUser.uid, friendId].sort().join("_");
}

/* ================= SEND MESSAGE ================= */
window.sendMsg = async () => {

    let text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db,"messages"), {
        chatId: chatId(),
        sender: currentUser.uid,
        text,
        time: Date.now(),
        seen:false
    });

    msgInput.value = "";

    setTyping(false);
};

/* ================= ENTER SEND ================= */
msgInput.addEventListener("keypress", (e)=>{
    if(e.key === "Enter"){
        sendMsg();
    }
});

/* ================= TYPING ================= */
msgInput.addEventListener("input", ()=>{
    setTyping(true);

    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(()=>{
        setTyping(false);
    },1000);
});

async function setTyping(val){
    await updateDoc(doc(db,"users",currentUser.uid),{
        typing: val
    });
}

/* ================= FORMAT TIME ================= */
function formatTime(t){
    let d = new Date(t);
    let h = d.getHours();
    let m = String(d.getMinutes()).padStart(2,'0');
    return `${h}:${m}`;
}

/* ================= LOAD MESSAGES ================= */
function loadMessages(){

    onSnapshot(
        query(collection(db,"messages"), where("chatId","==",chatId())),
        async snap=>{

            let msgs=[];
            snap.forEach(d=>msgs.push({id:d.id,...d.data()}));

            msgs.sort((a,b)=>a.time-b.time);

            let html="";

            for(let m of msgs){

                let cls = m.sender === currentUser.uid ? "me":"other";

                // mark seen if received
                if(m.sender !== currentUser.uid && !m.seen){
                    await updateDoc(doc(db,"messages",m.id),{
                        seen:true
                    });
                }

                let tick = "";

                if(m.sender === currentUser.uid){
                    tick = m.seen
                        ? "✔✔"   // blue tick (styled via CSS)
                        : "✔";   // single tick
                }

                html+=`
                <div class="msg ${cls}" onclick="selectMsg('${m.id}')">
                    ${m.text}

                    <div class="msg-bottom">
                        <span class="time">${formatTime(m.time)}</span>
                        <span class="tick ${m.seen ? 'seen':''}">${tick}</span>
                    </div>
                </div>`;
            }

            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    );

    /* 🔥 LISTEN TYPING */
    onSnapshot(doc(db,"users",friendId), s=>{
        let d = s.data();

        if(d.typing){
            status.innerText = "Typing...";
            status.style.color = "#00cfff";
        }
    });
}

/* ================= SELECT MESSAGE ================= */
window.selectMsg = (id)=>{
    selectedMsgId = id;
    actionModal.classList.add("active");
};

window.closeAction = ()=>{
    actionModal.classList.remove("active");
};

/* ================= DELETE ================= */
window.deleteForMe = async ()=>{
    await deleteDoc(doc(db,"messages",selectedMsgId));
    closeAction();
};

window.deleteForAll = async ()=>{
    await updateDoc(doc(db,"messages",selectedMsgId),{
        text:"🚫 Message deleted"
    });
    closeAction();
};
