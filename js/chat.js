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
let selectedMsgId = null;
let replyData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{

    if(!user) location.href="index.html";

    currentUser = user;
 getE1 ("replybox").style.display =
   "none";
    await updateDoc(doc(db,"users",user.uid),{
        online:true,
        lastSeen:Date.now(),
        typing:false
    });

    loadFriend();
    loadMessages();
});

/* ================= OFFLINE ================= */
window.addEventListener("beforeunload", async ()=>{
    if(currentUser){
        await updateDoc(doc(db,"users",currentUser.uid),{
            online:false,
            lastSeen:Date.now(),
            typing:false
        });
    }
});

/* ================= FRIEND ================= */
async function loadFriend(){

    let snap = await getDoc(doc(db,"users",friendId));
    let data = snap.data();

    getEl("chatName").innerText = data.name;

    onSnapshot(doc(db,"users",friendId),(s)=>{
        let d = s.data();

        if(d.typing){
            getEl("status").innerText="Typing...";
            getEl("status").className="online";
        }
        else if(d.online){
            getEl("status").innerText="Online";
            getEl("status").className="online";
        }else{
            let time=new Date(d.lastSeen || Date.now());
            getEl("status").innerText="Last seen " + time.toLocaleTimeString();
            getEl("status").className="";
        }
    });
}

/* ================= CHAT ID ================= */
function chatId(){
    return [currentUser.uid,friendId].sort().join("_");
}

/* ================= SEND ================= */
window.sendMsg = async ()=>{

    let text = getEl("msgInput").value.trim();
    if(!text) return;

    await addDoc(collection(db,"messages"),{
        chatId:chatId(),
        sender:currentUser.uid,
        text,
        time:Date.now(),
        seen:false,
        reply: replyData
    });

    getEl("msgInput").value="";
    cancelReply();

    // stop typing
    updateDoc(doc(db,"users",currentUser.uid),{typing:false});
};

/* ================= ENTER SEND ================= */
getEl("msgInput").addEventListener("keypress",(e)=>{
    if(e.key==="Enter"){
        e.preventDefault();
        sendMsg();
    }
});

/* ================= TYPING ================= */
getEl("msgInput").addEventListener("input", async ()=>{
    await updateDoc(doc(db,"users",currentUser.uid),{
        typing: true
    });

    setTimeout(()=>{
        updateDoc(doc(db,"users",currentUser.uid),{
            typing:false
        });
    },1000);
});

/* ================= TIME ================= */
function formatTime(t){
    let d=new Date(t);
    return d.getHours()+":"+String(d.getMinutes()).padStart(2,'0');
}

/* ================= LOAD ================= */
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

                /* SEEN */
                if(m.sender!==currentUser.uid && !m.seen){
                    await updateDoc(doc(db,"messages",m.id),{seen:true});
                }

                let ticks="";
                if(m.sender===currentUser.uid){
                    ticks = m.seen 
                        ? `<span class="seen">✔✔</span>` 
                        : `<span class="sent">✔</span>`;
                }

                /* REPLY UI */
                let replyHtml = "";
                if(m.reply){
                    replyHtml = `
                    <div class="reply-preview">
                        ${m.reply.text}
                    </div>`;
                }

                html+=`
                <div class="msg ${cls}" onclick="selectMsg('${m.id}','${m.text}')">
                    ${replyHtml}
                    ${m.text}
                    <div class="meta">${formatTime(m.time)} ${ticks}</div>
                </div>`;
            }

            let box = getEl("chatBox");
            box.innerHTML = html;
            box.scrollTop = box.scrollHeight;
        }
    );
}

/* ================= SELECT ================= */
window.selectMsg=(id,text)=>{
    selectedMsgId=id;
    replyData = {text}; // prepare reply
    getEl("modal").classList.add("active");
};

/* ================= MODAL ================= */
window.closeModal=()=>{
    getEl("modal").classList.remove("active");
};

/* ================= DELETE ================= */
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

/* ================= REPLY ================= */
window.replyMsg=()=>{
    getEl("replyBox").style.display="flex";
    getEl("replyText").innerText = replyData.text;
    closeModal();
};

/* CANCEL REPLY */
window.cancelReply=()=>{
    replyData=null;
    getEl("replyBox").style.display="none";
};

/* ================= MENU FIX ================= */
window.toggleSidebar = ()=>{
    document.getElementById("sidebar").classList.toggle("active");
};
