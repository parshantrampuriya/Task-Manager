import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id) => document.getElementById(id);

let currentUser = null;
let allQuestions = [];
let currentPath = [];
let selectedQuestion = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadAllQuestions();
});

/* ================= MENU ================= */
window.toggleSidebar = ()=>{
    const sidebar = getEl("sidebar");
    if(sidebar) sidebar.classList.toggle("active");
};

/* ================= TOAST ================= */
function showToast(msg){

    const toast = getEl("toast");

    toast.innerText = msg;
    toast.className = "show";

    setTimeout(()=>{
        toast.className = "";
    },2200);
}

/* ================= LOAD QUESTIONS ================= */
async function loadAllQuestions(){

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",currentUser.uid)
        )
    );

    allQuestions = [];

    snap.forEach(d=>{
        allQuestions.push({
            id:d.id,
            ...d.data()
        });
    });

    renderFiles();
}

/* ================= FILE MANAGER VIEW ================= */
function renderFiles(){

    const fileArea = getEl("fileArea");
    const pathText = getEl("pathText");

    pathText.innerText =
        currentPath.length === 0
        ? "Home"
        : currentPath.join(" > ");

    let folders = [];
    let questions = [];

    allQuestions.forEach(q=>{

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v !== "");

        let match = true;

        for(let i=0;i<currentPath.length;i++){
            if(levels[i] !== currentPath[i]){
                match = false;
                break;
            }
        }

        if(!match) return;

        if(levels.length > currentPath.length){

            const nextFolder = levels[currentPath.length];

            if(nextFolder && !folders.includes(nextFolder)){
                folders.push(nextFolder);
            }

        }else{
            questions.push(q);
        }
    });

    folders.sort();
    questions.sort((a,b)=>
        a.question.localeCompare(b.question)
    );

    let html = "";

    /* FOLDERS */
    folders.forEach(name=>{

        html += `
        <div class="file-item folder"
            onclick="openFolder('${safe(name)}')">

            <div class="file-icon">📁</div>
            <div class="file-name">${name}</div>

        </div>
        `;
    });

    /* QUESTIONS */
    questions.forEach(q=>{

        html += `
        <div class="file-item question"
            onclick="openQuestion('${q.id}')">

            <div class="file-icon">📄</div>
            <div class="file-name">${q.question}</div>

        </div>
        `;
    });

    if(!html){
        html = `
        <div class="file-item">
            <div class="file-name">Empty Folder</div>
        </div>
        `;
    }

    fileArea.innerHTML = html;
}

/* ================= SAFE TEXT ================= */
function safe(text){
    return text.replace(/'/g,"\\'");
}

/* ================= FOLDER OPEN ================= */
window.openFolder = (name)=>{
    currentPath.push(name);
    renderFiles();
};

/* ================= FOLDER BACK ================= */
window.goFolderBack = ()=>{

    if(currentPath.length > 0){
        currentPath.pop();
        renderFiles();
    }
};

/* ================= OPEN QUESTION ================= */
window.openQuestion = (id)=>{

    selectedQuestion =
        allQuestions.find(q=>q.id === id);

    if(!selectedQuestion) return;

    getEl("popupQuestion").innerText =
        selectedQuestion.question;

    getEl("popupContent").innerHTML =
        `<p>Select Preview or Edit</p>`;

    getEl("popup").classList.add("show");
};

/* ================= CLOSE POPUP ================= */
window.closePopup = ()=>{
    getEl("popup").classList.remove("show");
};

/* ================= PREVIEW QUESTION ================= */
window.previewQuestion = ()=>{

    if(!selectedQuestion) return;

    let ans = parseInt(selectedQuestion.answer);

    if(isNaN(ans)) ans = 0;

    let html = "";

    selectedQuestion.options.forEach((op,index)=>{

        const correct = index === ans;

        html += `
        <div class="option-box ${correct ? 'correct' : ''}">
            ${String.fromCharCode(65+index)}. ${op}
            ${correct ? ' ✅ Correct' : ''}
        </div>
        `;
    });

    getEl("popupContent").innerHTML = html;
};

/* ================= EDIT QUESTION ================= */
window.editQuestion = ()=>{

    if(!selectedQuestion) return;

    let ans = parseInt(selectedQuestion.answer);

    if(isNaN(ans)) ans = 0;

    let html = `
    <label>Question</label>
    <textarea id="editQ">${selectedQuestion.question}</textarea>
    `;

    selectedQuestion.options.forEach((op,i)=>{

        html += `
        <label>Option ${String.fromCharCode(65+i)}</label>
        <input id="op${i}" value="${op}">
        `;
    });

    html += `
    <label>Correct Answer</label>

    <select id="correctAns">
        <option value="0">A</option>
        <option value="1">B</option>
        <option value="2">C</option>
        <option value="3">D</option>
    </select>

    <button class="save-btn" onclick="saveEdit()">
        💾 Save Changes
    </button>
    `;

    getEl("popupContent").innerHTML = html;

    document.getElementById("correctAns").value = String(ans);
};

/* ================= SAVE EDIT ================= */
window.saveEdit = async ()=>{

    if(!selectedQuestion) return;

    const newQ =
        getEl("editQ").value.trim();

    const options = [
        getEl("op0").value.trim(),
        getEl("op1").value.trim(),
        getEl("op2").value.trim(),
        getEl("op3").value.trim()
    ];

    const answer =
        parseInt(getEl("correctAns").value);

    await updateDoc(
        doc(db,"questionBank",selectedQuestion.id),
        {
            question:newQ,
            options,
            answer
        }
    );

    showToast("Updated Successfully ✅");

    closePopup();

    await loadAllQuestions();
};
