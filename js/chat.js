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

const getEl = (id)=>document.getElementById(id);

const params = new URLSearchParams(location.search);
const friendId = params.get("uid");

let currentUser;
let selectedMsgId=null;

/* AUTH */
onAuthStateChanged(auth, async (user)=>{

    if(!user) location.href="index.html";

    currentUser=user;

    await updateDoc(doc(db,"users",user.uid),{
        online:true,
        lastSeen:Date.now()
    });

    loadFriend();
    loadMessages();
});

/* OFFLINE */
window.addEventListener("beforeunload", async ()=>{
    if(currentUser){
        await updateDoc(doc(db,"users",currentUser.uid),{
            online:false,
            lastSeen:Date.now()
        });
    }
});

/* FRIEND INFO */
async function loadFriend(){

    let snap = await getDoc(doc(db,"users",friendId));
    let data = snap.data();

    getEl("chatName").innerText = data.name;

    onSnapshot(doc(db,"users",friendId),(s)=>{
        let d = s.data();

        if(d.online){
            getEl("status").innerText="Online";
            getEl("status").className="online";
        }else{
            let time=new Date(d.lastSeen || Date.now());
            getEl("status").innerText="Last seen " + time.toLocaleTimeString();
            getEl("status").className="";
        }
    });
}

/* CHAT ID */
function chatId(){
    return [currentUser.uid,friendId].sort().join("_");
}

/* SEND */
window.sendMsg = async ()=>{

    let text = getEl("msgInput").value.trim();
    if(!text) return;

    await addDoc(collection(db,"messages"),{
        chatId:chatId(),
        sender:currentUser.uid,
        text,
        time:Date.now(),
        seen:false
    });

    getEl("msgInput").value="";
};

/* ENTER */
getEl("msgInput").addEventListener("keypress",(e)=>{
    if(e.key==="Enter") sendMsg();
});

/* TIME */
function formatTime(t){
    let d=new Date(t);
    return d.getHours()+":"+String(d.getMinutes()).padStart(2,'0');
}

/* LOAD MESSAGES */
function loadMessages(){

    onSnapshot(
        query(collection(db,"messages"), where("chatId","==",chatId())),
        async snap=>{

            let msgs=[];
            snap.forEach(d=>msgs.push({id:d.id,...d.data()}));

            msgs.sort((a,b)=>a.time-b.time);

            let html="";

            for(let m of msgs){

                let cls = m.sender===currentUser.uid ? "me":"other";

                /* MARK SEEN */
                if(m.sender!==currentUser.uid && !m.seen){
                    await updateDoc(doc(db,"messages",m.id),{seen:true});
                }

                let ticks="";
                if(m.sender===currentUser.uid){
                    ticks = m.seen ? "✔✔" : "✔";
                }

                html+=`
                <div class="msg ${cls}" onclick="selectMsg('${m.id}')">
                    ${m.text}
                    <div class="meta">${formatTime(m.time)} ${ticks}</div>
                </div>`;
            }

            getEl("chatBox").innerHTML=html;
            getEl("chatBox").scrollTop = getEl("chatBox").scrollHeight;
        }
    );
}

/* SELECT */
window.selectMsg=(id)=>{
    selectedMsgId=id;
    getEl("modal").classList.add("active");
};

window.closeModal=()=>{
    getEl("modal").classList.remove("active");
};

/* DELETE */
window.deleteForMe=async ()=>{
    await deleteDoc(doc(db,"messages",selectedMsgId));
    closeModal();
};

window.deleteForAll=async ()=>{
    await updateDoc(doc(db,"messages",selectedMsgId),{
        text:"🚫 Message deleted"
    });
    closeModal();
};
