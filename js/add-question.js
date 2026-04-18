import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id) => document.getElementById(id);

let currentUser = null;
let previewOpen = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadSubjects();
});

/* ================= MENU ================= */
window.toggleSidebar = ()=>{
    const sidebar = getEl("sidebar");
    if(sidebar) sidebar.classList.toggle("active");
};

/* ================= TOAST ================= */
function showToast(msg,type="success"){

    const toast = getEl("toast");

    toast.innerText = msg;
    toast.className = "";
    toast.classList.add("show",type);

    setTimeout(()=>{
        toast.classList.remove("show");
    },2500);
}

/* ================= MODE ================= */
getEl("modeSelect").addEventListener("change", ()=>{

    const mode = getEl("modeSelect").value;

    if(mode === "new"){
        getEl("newArea").style.display = "block";
        getEl("existingArea").style.display = "none";
    }else{
        getEl("newArea").style.display = "none";
        getEl("existingArea").style.display = "block";
    }
});

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects(){

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",currentUser.uid)
        )
    );

    let arr = [];

    snap.forEach(doc=>{
        const d = doc.data();

        if(d.subject && !arr.includes(d.subject)){
            arr.push(d.subject);
        }
    });

    fillSelect("subjectList",arr);
    fillSelect("chapterList",[]);
    fillSelect("topicList",[]);
}

/* ================= SUBJECT CHANGE ================= */
getEl("subjectList").addEventListener("change", async ()=>{

    const subject = getEl("subjectList").value;

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",currentUser.uid),
            where("subject","==",subject)
        )
    );

    let arr = [];

    snap.forEach(doc=>{
        const d = doc.data();

        if(d.chapter && !arr.includes(d.chapter)){
            arr.push(d.chapter);
        }
    });

    fillSelect("chapterList",arr);
    fillSelect("topicList",[]);
});

/* ================= CHAPTER CHANGE ================= */
getEl("chapterList").addEventListener("change", async ()=>{

    const subject = getEl("subjectList").value;
    const chapter = getEl("chapterList").value;

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",currentUser.uid),
            where("subject","==",subject),
            where("chapter","==",chapter)
        )
    );

    let arr = [];

    snap.forEach(doc=>{
        const d = doc.data();

        if(d.topic && !arr.includes(d.topic)){
            arr.push(d.topic);
        }
    });

    fillSelect("topicList",arr);
});

/* ================= FILL SELECT ================= */
function fillSelect(id,data){

    let html = `<option value="">Select</option>`;

    data.forEach(v=>{
        html += `<option value="${v}">${v}</option>`;
    });

    getEl(id).innerHTML = html;
}

/* ================= PREVIEW ================= */
window.previewQuestions = ()=>{

    const box = getEl("previewBox");

    if(previewOpen){
        box.innerHTML = "No Preview Yet";
        previewOpen = false;
        return;
    }

    const raw = getEl("jsonBox").value.trim();

    if(!raw){
        showToast("Paste JSON First","error");
        return;
    }

    let data = [];

    try{
        data = JSON.parse(raw);
    }catch{
        showToast("Invalid JSON","error");
        return;
    }

    let html = "";

    data.forEach((q,i)=>{

        const ans = Number(
            q.answer ??
            q.correct_option ??
            q.correctAnswer ??
            0
        );

        html += `
        <div class="qbox">
            <h3>Q${i+1}. ${q.question}</h3>
        `;

        q.options.forEach((op,index)=>{

            html += `
            <div class="opt ${index===ans ? 'correct':''}">
                ${String.fromCharCode(65+index)}. ${op}
            </div>
            `;
        });

        html += `</div>`;
    });

    box.innerHTML = html;
    previewOpen = true;
};

/* ================= SAVE ================= */
window.saveQuestions = async ()=>{

    const raw = getEl("jsonBox").value.trim();

    if(!raw){
        showToast("Paste JSON First","error");
        return;
    }

    let data = [];

    try{
        data = JSON.parse(raw);
    }catch{
        showToast("Invalid JSON","error");
        return;
    }

    let subject="", chapter="", topic="";

    const mode = getEl("modeSelect").value;

    if(mode==="new"){

        subject = getEl("subject").value.trim();
        chapter = getEl("chapter").value.trim();
        topic   = getEl("topic").value.trim();

    }else{

        subject = getEl("subjectList").value.trim();
        chapter = getEl("chapterList").value.trim();
        topic   = getEl("topicList").value.trim();
    }

    if(!subject){
        showToast("Subject Required","error");
        return;
    }

    for(let q of data){

        const answer = Number(
            q.answer ??
            q.correct_option ??
            q.correctAnswer ??
            0
        );

        await addDoc(collection(db,"questionBank"),{

            uid: currentUser.uid,

            subject,
            chapter,
            topic,

            question: q.question,
            options: q.options,
            answer,

            createdAt: Date.now()
        });
    }

    /* CLEAR */
    getEl("jsonBox").value = "";
    getEl("previewBox").innerHTML = "No Preview Yet";

    getEl("subject").value = "";
    getEl("chapter").value = "";
    getEl("topic").value = "";

    getEl("subjectList").selectedIndex = 0;
    fillSelect("chapterList",[]);
    fillSelect("topicList",[]);

    previewOpen = false;

    await loadSubjects();

    showToast("Questions Saved Successfully ✅","success");
};
