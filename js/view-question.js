/* ================= UPDATED view-question.js ================= */
/* OWN MODE + FRIEND READ ONLY MODE */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allQuestions = [];
let currentPath = [];
let selectedQuestion = null;
let holdTimer = null;

/* FRIEND MODE */
const params = new URLSearchParams(location.search);
const friendUid = params.get("uid");
let readOnly = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href="index.html";
        return;
    }

    currentUser = user;

    /* if friend uid exists and not mine */
    if(friendUid && friendUid !== user.uid){
        readOnly = true;
    }

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

/* ================= LOAD ================= */
async function loadAllQuestions(){

    const targetUid =
        readOnly ? friendUid : currentUser.uid;

    const snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("uid","==",targetUid)
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

/* ================= FILE VIEW ================= */
function renderFiles(){

    const fileArea = getEl("fileArea");
    const pathText = getEl("pathText");
    const viewBtn = getEl("viewAllBtn");

    pathText.innerText =
        currentPath.length===0
        ? "Home"
        : currentPath.join(" > ");

    let folders = [];
    let questions = [];

    allQuestions.forEach(q=>{

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v!== "");

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

    folders.sort((a,b)=>a.localeCompare(b));
    questions.sort((a,b)=>a.question.localeCompare(b.question));

    if(viewBtn){
        viewBtn.style.display =
        questions.length>0 ? "inline-flex":"none";
    }

    let html = "";

    folders.forEach(name=>{

        html += `
        <div class="file-item folder"
        onclick="openFolder('${safe(name)}')"

        ${
          readOnly
          ? ""
          :
          `
          onmousedown="startHold('${safe(name)}')"
          ontouchstart="startHold('${safe(name)}')"
          onmouseup="cancelHold()"
          onmouseleave="cancelHold()"
          ontouchend="cancelHold()"
          `
        }>

        <div class="file-icon">📁</div>
        <div class="file-name">${name}</div>

        </div>`;
    });

    questions.forEach((q,index)=>{

        html += `
        <div class="file-item question"
        onclick="openQuestion('${q.id}')">

        <div class="file-icon">📄</div>

        <div class="file-name">
        Q${index+1}. ${q.question}
        </div>

        </div>`;
    });

    if(!html){
        html=`
        <div class="file-item">
        <div class="file-name">Empty Folder</div>
        </div>`;
    }

    fileArea.innerHTML = html;
}

/* ================= SAFE ================= */
function safe(text){
    return text.replace(/'/g,"\\'");
}

/* ================= FOLDER ================= */
window.openFolder = (name)=>{
    currentPath.push(name);
    renderFiles();
};

window.goFolderBack = ()=>{
    if(currentPath.length>0){
        currentPath.pop();
        renderFiles();
    }
};

/* ================= HOLD ================= */
window.startHold = (name)=>{

    if(readOnly) return;

    holdTimer = setTimeout(()=>{
        folderPopup(name);
    },900);
};

window.cancelHold = ()=>{
    clearTimeout(holdTimer);
};

/* ================= FOLDER POPUP ================= */
function folderPopup(name){

    if(readOnly) return;

    getEl("popupQuestion").innerText =
    "📁 Folder : " + name;

    getEl("popupContent").innerHTML = `
    <div class="popup-btn-row">

    <button class="save-btn"
    onclick="openFolder('${safe(name)}');closePopup()">
    📂 Open Folder
    </button>

    <button class="edit-btn"
    onclick="renameFolder('${safe(name)}')">
    ✏ Edit Name
    </button>

    <button class="delete-btn"
    onclick="deleteFolder('${safe(name)}')">
    🗑 Delete Folder
    </button>

    </div>`;

    getEl("popup").classList.add("show");
}

/* ================= OPEN QUESTION ================= */
window.openQuestion = (id)=>{

    selectedQuestion =
    allQuestions.find(q=>q.id===id);

    if(!selectedQuestion) return;

    getEl("popupQuestion").innerText =
    selectedQuestion.question;

    /* FRIEND MODE */
    if(readOnly){

        getEl("popupContent").innerHTML = `
        <div class="popup-btn-row">

        <button class="preview-btn"
        onclick="previewQuestion()">
        👁 Preview
        </button>

        </div>`;

    }else{

        getEl("popupContent").innerHTML = `
        <div class="popup-btn-row">

        <button class="preview-btn"
        onclick="previewQuestion()">
        👁 Preview
        </button>

        <button class="edit-btn"
        onclick="editQuestion()">
        ✏ Edit
        </button>

        <button class="delete-btn"
        onclick="deleteQuestion()">
        🗑 Delete
        </button>

        </div>`;
    }

    getEl("popup").classList.add("show");
};

/* ================= CLOSE ================= */
window.closePopup = ()=>{
    getEl("popup").classList.remove("show");
};

/* ================= PREVIEW ================= */
window.previewQuestion = ()=>{

    let ans=parseInt(selectedQuestion.answer);
    if(isNaN(ans)) ans=0;

    let html="";

    selectedQuestion.options.forEach((op,i)=>{

        html += `
        <div class="option-box ${i===ans?"correct":""}">
        ${String.fromCharCode(65+i)}.
        ${op}
        ${i===ans?" ✅ Correct":""}
        </div>`;
    });

    getEl("popupContent").innerHTML = html;
};

/* ================= VIEW ALL ================= */
window.viewAllQuestions = ()=>{

    let questions=[];

    allQuestions.forEach(q=>{

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v!== "");

        let ok=true;

        for(let i=0;i<currentPath.length;i++){
            if(levels[i]!==currentPath[i]){
                ok=false;
                break;
            }
        }

        if(ok && levels.length===currentPath.length){
            questions.push(q);
        }
    });

    questions.sort((a,b)=>
        a.question.localeCompare(b.question)
    );

    let html="";

    questions.forEach((q,no)=>{

        let ans=parseInt(q.answer);
        if(isNaN(ans)) ans=0;

        html += `
        <div class="all-box">
        <h3>Q${no+1}. ${q.question}</h3>`;

        q.options.forEach((op,i)=>{

            html += `
            <div class="option-box ${i===ans?"correct":""}">
            ${String.fromCharCode(65+i)}.
            ${op}
            ${i===ans?" ✅":""}
            </div>`;
        });

        html += `</div>`;
    });

    getEl("popupQuestion").innerText =
    "All Questions Preview";

    getEl("popupContent").innerHTML = html;

    getEl("popup").classList.add("show");
};

/* ================= OWNER ONLY FUNCTIONS ================= */

window.renameFolder = async ()=>{};
window.saveRenameFolder = async ()=>{};
window.deleteFolder = async ()=>{};
window.editQuestion = async ()=>{};
window.saveEdit = async ()=>{};
window.deleteQuestion = async ()=>{};

/* keep your existing owner edit/delete functions below if needed */
