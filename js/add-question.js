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
onAuthStateChanged(auth, async (user) => {

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadSubjects();
});

/* ================= SIDEBAR ================= */
window.toggleSidebar = () => {
    const sidebar = getEl("sidebar");
    if(sidebar) sidebar.classList.toggle("active");
};

/* ================= MODE SWITCH ================= */
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

    let subjects = [];

    snap.forEach(doc => {
        const d = doc.data();

        if(d.subject && !subjects.includes(d.subject)){
            subjects.push(d.subject);
        }
    });

    fillSelect("subjectList", subjects);
    fillSelect("chapterList", []);
    fillSelect("topicList", []);
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

    let chapters = [];

    snap.forEach(doc => {

        const d = doc.data();

        if(d.chapter && !chapters.includes(d.chapter)){
            chapters.push(d.chapter);
        }
    });

    fillSelect("chapterList", chapters);
    fillSelect("topicList", []);
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

    let topics = [];

    snap.forEach(doc => {

        const d = doc.data();

        if(d.topic && !topics.includes(d.topic)){
            topics.push(d.topic);
        }
    });

    fillSelect("topicList", topics);
});

/* ================= FILL SELECT ================= */
function fillSelect(id, arr){

    let html = `<option value="">Select</option>`;

    arr.forEach(v=>{
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
        box.innerHTML = "Paste JSON first";
        return;
    }

    let data = [];

    try{
        data = JSON.parse(raw);
    }catch{
        box.innerHTML = "Invalid JSON";
        return;
    }

    let html = "";

    data.forEach((q,i)=>{

        const ans =
            Number(
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
        alert("Paste JSON first");
        return;
    }

    let data = [];

    try{
        data = JSON.parse(raw);
    }catch{
        alert("Invalid JSON");
        return;
    }

    let subject = "";
    let chapter = "";
    let topic   = "";

    const mode = getEl("modeSelect").value;

    /* NEW MODE */
    if(mode === "new"){

        subject = getEl("subject").value.trim();
        chapter = getEl("chapter").value.trim();
        topic   = getEl("topic").value.trim();

    }else{

        subject = getEl("subjectList").value.trim();
        chapter = getEl("chapterList").value.trim();
        topic   = getEl("topicList").value.trim();
    }

    /* Subject compulsory */
    if(!subject){
        alert("Subject required");
        return;
    }

    for(let q of data){

        const answer =
            Number(
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

    alert("Questions Saved Successfully ✅");

    /* CLEAR ALL */
    getEl("jsonBox").value = "";
    getEl("previewBox").innerHTML = "No Preview Yet";
    previewOpen = false;

    getEl("subject").value = "";
    getEl("chapter").value = "";
    getEl("topic").value = "";

    getEl("subjectList").selectedIndex = 0;
    getEl("chapterList").innerHTML = `<option value="">Select</option>`;
    getEl("topicList").innerHTML = `<option value="">Select</option>`;

    await loadSubjects();
};
