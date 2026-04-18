import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id) => document.getElementById(id);

let currentUser = null;
let allBankQuestions = [];
let myFriends = [];
let sourceMode = "bank";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadSubjects();
    await loadFriends();
});

/* ================= MENU ================= */
window.toggleSidebar = () => {
    const bar = getEl("sidebar");
    if(bar) bar.classList.toggle("active");
};

/* ================= MODE BUTTON ================= */
window.setSourceMode = (mode) => {

    sourceMode = mode;

    getEl("btnBank").classList.remove("active");
    getEl("btnManual").classList.remove("active");

    if(mode === "bank"){
        getEl("btnBank").classList.add("active");
        getEl("bankArea").style.display = "block";
        getEl("manualArea").style.display = "none";
    }else{
        getEl("btnManual").classList.add("active");
        getEl("bankArea").style.display = "none";
        getEl("manualArea").style.display = "block";
    }
};

/* ================= TOAST ================= */
function showToast(msg){
    const t = getEl("toast");
    t.innerText = msg;
    t.classList.add("show");

    setTimeout(()=>{
        t.classList.remove("show");
    },2000);
}

/* ================= CENTER ERROR ================= */
function showError(msg){
    const p = getEl("errorPopup");
    p.innerText = msg;
    p.classList.add("show");

    setTimeout(()=>{
        p.classList.remove("show");
    },1200);
}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects(){

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",currentUser.uid)
        )
    );

    allBankQuestions = [];

    let subjects = [];

    snap.forEach(doc=>{

        const d = doc.data();

        allBankQuestions.push(d);

        if(d.subject && !subjects.includes(d.subject)){
            subjects.push(d.subject);
        }
    });

    subjects.sort();

    fillSelect("subjectList",subjects);
    fillSelect("chapterList",[]);
    fillSelect("topicList",[]);
}

/* ================= LOAD FRIENDS ================= */
async function loadFriends(){

    const snap = await getDocs(collection(db,"friends"));

    let html = "";

    for(const item of snap.docs){

        const users = item.data().users || [];

        if(!users.includes(currentUser.uid)) continue;

        const fid = users.find(x=>x !== currentUser.uid);

        if(!fid) continue;

        myFriends.push(fid);

        let name = "Friend";

        const userSnap = await getDocs(
            query(
                collection(db,"users"),
                where("__name__","==",fid)
            )
        );

        if(!userSnap.empty){
            name = userSnap.docs[0].data().name || "Friend";
        }

        html += `
        <label class="friend-item">
            <input type="checkbox" value="${fid}" class="friendCheck">
            <span>👤 ${name}</span>
        </label>`;
    }

    getEl("friendList").innerHTML =
        html || `<div>No Friends Found</div>`;
}

/* ================= FILL SELECT ================= */
function fillSelect(id, arr){

    let html = `<option value="">All</option>`;

    arr.forEach(v=>{
        html += `<option value="${v}">${v}</option>`;
    });

    getEl(id).innerHTML = html;
}

/* ================= SUBJECT CHANGE ================= */
getEl("subjectList").addEventListener("change", ()=>{

    const subject = getEl("subjectList").value;

    let chapters = [];

    allBankQuestions.forEach(q=>{
        if(q.subject === subject && q.chapter){
            if(!chapters.includes(q.chapter)){
                chapters.push(q.chapter);
            }
        }
    });

    chapters.sort();

    fillSelect("chapterList",chapters);
    fillSelect("topicList",[]);
});

/* ================= CHAPTER CHANGE ================= */
getEl("chapterList").addEventListener("change", ()=>{

    const subject = getEl("subjectList").value;
    const chapter = getEl("chapterList").value;

    let topics = [];

    allBankQuestions.forEach(q=>{
        if(
            q.subject === subject &&
            q.chapter === chapter &&
            q.topic
        ){
            if(!topics.includes(q.topic)){
                topics.push(q.topic);
            }
        }
    });

    topics.sort();

    fillSelect("topicList",topics);
});

/* ================= RESULT OPTION ================= */
window.handleResultMode = (type)=>{

    const instant = getEl("instantResult");
    const release = getEl("releaseLater");

    if(type === "instant" && instant.checked){
        release.checked = false;
    }

    if(type === "release" && release.checked){
        instant.checked = false;
    }
};

/* ================= GET FILTERED QUESTIONS ================= */
function getFilteredQuestions(){

    const subject = getEl("subjectList").value.trim();
    const chapter = getEl("chapterList").value.trim();
    const topic   = getEl("topicList").value.trim();

    let arr = [...allBankQuestions];

    if(subject){
        arr = arr.filter(x=>x.subject === subject);
    }

    if(chapter){
        arr = arr.filter(x=>x.chapter === chapter);
    }

    if(topic){
        arr = arr.filter(x=>x.topic === topic);
    }

    return arr;
}

/* ================= PREVIEW ================= */
window.previewTest = ()=>{

    let questions = [];

    if(sourceMode === "bank"){
        questions = getFilteredQuestions();
    }else{

        try{
            questions = JSON.parse(
                getEl("manualJson").value.trim()
            );
        }catch{
            showError("Invalid JSON");
            return;
        }
    }

    const count = Number(getEl("questionCount").value);

    if(questions.length < count){
        showError("Not sufficient questions");
        return;
    }

    let html = `
    <b>Total Available:</b> ${questions.length}<br>
    <b>Test Questions:</b> ${count}<br><br>
    Ready to Create Test ✅
    `;

    getEl("previewBox").innerHTML = html;
};

/* ================= CREATE TEST ================= */
window.createTest = async ()=>{

    const testName = getEl("testName").value.trim();

    if(!testName){
        showError("Enter Test Name");
        return;
    }

    const count = Number(getEl("questionCount").value);

    let questions = [];

    if(sourceMode === "bank"){

        questions = getFilteredQuestions();

    }else{

        try{
            questions = JSON.parse(
                getEl("manualJson").value.trim()
            );
        }catch{
            showError("Invalid JSON");
            return;
        }
    }

    if(questions.length < count){
        showError("Not sufficient questions");
        return;
    }

    questions = questions.sort(()=>Math.random()-0.5)
                         .slice(0,count);

    const assign = [];

    if(getEl("assignSelf").checked){
        assign.push(currentUser.uid);
    }

    document
    .querySelectorAll(".friendCheck:checked")
    .forEach(ch=>{
        assign.push(ch.value);
    });

    if(assign.length === 0){
        showError("Select Candidate");
        return;
    }

    await addDoc(collection(db,"tests"),{

        createdBy : currentUser.uid,
        testName,
        totalMarks : Number(getEl("totalMarks").value),
        passMarks : Number(getEl("passMarks").value),
        duration : Number(getEl("duration").value),
        negativePercent :
            Number(getEl("negativeMarks").value),

        shuffleQuestions :
            getEl("shuffleQuestions").checked,

        shuffleOptions :
            getEl("shuffleOptions").checked,

        instantResult :
            getEl("instantResult").checked,

        releaseLater :
            getEl("releaseLater").checked,

        assignedTo : assign,
        questions,
        createdAt : Date.now()
    });

    showToast("Test Created ✅");
};

/* ================= DEFAULT ================= */
setSourceMode("bank");
