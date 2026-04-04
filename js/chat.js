import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, addDoc, onSnapshot, query, where,
  doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const friendId = new URLSearchParams(location.search).get("uid");

let user, selectedMsg = null, replyMsg=null;

/* AUTH */
onAuthStateChanged(auth, async (u)=>{
    user=u;
    setOnline(true);
    loadFriend();
    loadMessages();
});

/* ONLINE */
async function setOnline(val){
    await updateDoc(doc(db,"users",user.uid),{
        online:val,
        lastSeen:Date.now()
    });
}

window.onbeforeunload=()=>setOnline(false);

/* FRIEND */
async function loadFriend(){
    let s=await getDoc(doc(db,"users",friendId));
    chatName.innerText=s.data().name;

    onSnapshot(doc(db,"users",friendId), snap=>{
        let d=snap.data();

        if(d.typing) status.innerText="Typing...";
        else if(d.online) status.innerText="Online";
        else status.innerText="Last seen "+new Date(d.lastSeen).toLocaleTimeString();
    });
}

/* CHAT ID */
function cid(){
    return [user.uid,friendId].sort().join("_");
}

/* SEND */
window.sendMsg=async ()=>{
    let text=msgInput.value.trim();
    if(!text) return;

    await addDoc(collection(db,"messages"),{
        chatId:cid(),
        sender:user.uid,
        text,
        reply:replyMsg||null,
        time:Date.now(),
        seen:false
    });

    msgInput.value="";
    replyMsg=null;
    replyBox.classList.add("hidden");
};

/* LOAD */
function loadMessages(){
    onSnapshot(query(collection(db,"messages"),where("chatId","==",cid())),snap=>{

        let arr=[];
        snap.forEach(d=>arr.push({id:d.id,...d.data()}));
        arr.sort((a,b)=>a.time-b.time);

        chatBox.innerHTML="";

        arr.forEach(m=>{

            if(m.sender!==user.uid && !m.seen){
                updateDoc(doc(db,"messages",m.id),{seen:true});
            }

            let div=document.createElement("div");
            div.className="msg "+(m.sender===user.uid?"me":"other");

            div.innerHTML=`
                ${m.reply?`<small>↩ ${m.reply}</small><br>`:""}
                ${m.text}
                <div class="meta">
                    ${time(m.time)}
                    ${m.sender===user.uid?`<span class="tick ${m.seen?"seen":""}">${m.seen?"✔✔":"✔"}</span>`:""}
                </div>
            `;

            /* CLICK = DELETE */
            div.onclick=()=>{
                selectedMsg=m.id;
                modal.classList.remove("hidden");
            };

            /* SWIPE / DRAG REPLY */
            div.onmousedown=()=>{
                replyMsg=m.text;
                replyBox.innerText="Replying: "+m.text;
                replyBox.classList.remove("hidden");
            };

            chatBox.appendChild(div);
        });

        chatBox.scrollTop=chatBox.scrollHeight;
    });
}

/* DELETE */
window.deleteForMe=()=>{
    deleteDoc(doc(db,"messages",selectedMsg));
    closeModal();
};

window.deleteForAll=()=>{
    updateDoc(doc(db,"messages",selectedMsg),{text:"🚫 Deleted"});
    closeModal();
};

window.closeModal=()=>modal.classList.add("hidden");

/* TIME */
function time(t){
    let d=new Date(t);
    return d.getHours()+":"+String(d.getMinutes()).padStart(2,'0');
}

/* TYPING */
msgInput.addEventListener("input",async ()=>{
    await updateDoc(doc(db,"users",user.uid),{typing:true});

    clearTimeout(window.tt);
    window.tt=setTimeout(()=>{
        updateDoc(doc(db,"users",user.uid),{typing:false});
    },1000);
});

/* ENTER */
msgInput.addEventListener("keypress",e=>{
    if(e.key==="Enter") sendMsg();
});
