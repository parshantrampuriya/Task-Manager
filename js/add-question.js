import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */
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
        getEl("newFields").style.display = "block";
        getEl("existingFields").style.display = "none";
    }else{
        getEl("newFields").style.display = "none";
        getEl("existingFields").style.display = "block";
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
}

/* ================= LOAD CHAPTERS ================= */
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
});

/* ================= LOAD TOPICS ================= */
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

    const area = getEl("previewArea");

    if(previewOpen){
        area.innerHTML = "No Preview Yet";
        previewOpen = false;
        return;
    }

    const raw = getEl("jsonBox").value.trim();

    if(!raw){
        area.innerHTML = "Paste JSON first";
        return;
    }

    let data = [];

    try{
        data = JSON.parse(raw);
    }catch{
        area.innerHTML = "Invalid JSON";
        return;
    }

    let html = "";

    data.forEach((q,i)=>{

        html += `
        <div class="q-card">
            <div class="q-title">
                Q${i+1}. ${q.question}
            </div>
        `;

        q.options.forEach((op,index)=>{

            html += `
            <div class="option ${index == q.answer ? 'correct':''}">
                ${String.fromCharCode(65+index)}. ${op}
            </div>
            `;
        });

        html += `</div>`;
    });

    area.innerHTML = html;
    previewOpen = true;
};

/* ================= SAVE ================= */
window.saveQuestions = async ()=>{

    const raw = getEl("jsonBox").value.trim();

    if(!raw){
        alert("Paste JSON first");
        return;
    }

    let questions = [];

    try{
        questions = JSON.parse(raw);
    }catch{
        alert("Invalid JSON");
        return;
    }

    let subject, chapter, topic;

    const mode = getEl("modeSelect").value;

    if(mode === "new"){

        subject = getEl("subject").value.trim();
        chapter = getEl("chapter").value.trim();
        topic   = getEl("topic").value.trim();

    }else{

        subject = getEl("subjectList").value;
        chapter = getEl("chapterList").value;
        topic   = getEl("topicList").value;
    }

    if(!subject || !chapter || !topic){
        alert("Select folder path");
        return;
    }

    for(let q of questions){

        const answer =
            q.answer ??
            q.correct_option ??
            q.correctAnswer ??
            0;

        await addDoc(collection(db,"questionBank"),{

            uid: currentUser.uid,

            subject,
            chapter,
            topic,

            question: q.question,
            options: q.options,
            answer: Number(answer),

            createdAt: Date.now()
        });
    }

    alert("Questions Saved Successfully ✅");

    getEl("jsonBox").value = "";
    getEl("previewArea").innerHTML = "No Preview Yet";
    previewOpen = false;

    await loadSubjects();
};
