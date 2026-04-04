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

    if (!user) location.href = "index.html";

    currentUser = user;

    /* SET ONLINE */
    await updateDoc(doc(db,"users",user.uid),{
        online:true,
        lastSeen:Date.now()
    });

    loadFriend();
    loadMessages();
});

/* OFFLINE */
window.addEventListener("beforeunload", async ()=>{
    if(auth.currentUser){
        await updateDoc(doc(db,"users",auth.currentUser.uid),{
            online:false,
            lastSeen:Date.now()
        });
    }
});

/* FRIEND INFO */
async function loadFriend(){

    let snap = await getDoc(doc(db,"users",friendId));
    chatName.innerText = snap.data().name;

    onSnapshot(doc(db,"users",friendId), s=>{
        let d = s.data();

        if(d.online){
            status.innerText = "🟢 Online";
            status.className="online";
        }else{
            let t = new Date(d.lastSeen || Date.now());
            status.innerText = "Last seen " + t.toLocaleTimeString();
        }
    });
}

/* CHAT ID */
function chatId(){
    return [currentUser.uid,friendId].sort().join("_");
}

/* SEND */
window.sendMsg = async ()=>{
    let text = msgInput.value.trim();
    if(!text) return;

    await addDoc(collection(db,"messages"),{
        chatId:chatId(),
        sender:currentUser.uid,
        text,
        time:Date.now(),
        seen:false
    });

    msgInput.value="";
};

/* ENTER SEND */
msgInput.addEventListener("keypress", e=>{
    if(e.key==="Enter") sendMsg();
});

/* LOAD MSG */
function loadMessages(){

    onSnapshot(
        query(collection(db,"messages"), where("chatId","==",chatId())),
        snap=>{

            let msgs=[];
            snap.forEach(d=>msgs.push({id:d.id,...d.data()}));
            msgs.sort((a,b)=>a.time-b.time);

            let html="";

            msgs.forEach(m=>{

                let mine = m.sender===currentUser.uid;

                if(!mine){
                    updateDoc(doc(db,"messages",m.id),{seen:true});
                }

                let tick="";
                if(mine){
                    tick = m.seen ? "✔✔" : "✔";
                }

                html+=`
                <div class="msg ${mine?'me':'other'}">
                    ${m.text}
                    <div class="meta">
                        ${formatTime(m.time)} ${tick}
                    </div>
                </div>`;
            });

            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    );
}

/* TIME */
function formatTime(t){
    let d=new Date(t);
    return d.getHours()+":"+String(d.getMinutes()).padStart(2,'0');
}
