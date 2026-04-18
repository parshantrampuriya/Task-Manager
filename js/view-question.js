/* ================= UPDATED view-question.js ================= */
/* OLD FEATURES KEPT + DUPLICATE FIX + BEAUTIFUL RENAME POPUP */

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
const getEl = (id) => document.getElementById(id);

let currentUser = null;
let allQuestions = [];
let currentPath = [];
let selectedQuestion = null;
let holdTimer = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href="index.html";
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

/* ================= LOAD ================= */
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
        questions.length>0 ? "inline-flex" : "none";
    }

    let html = "";

    /* FOLDERS */
    folders.forEach(name=>{

        html += `
        <div class="file-item folder"
            onclick="openFolder('${safe(name)}')"

            onmousedown="startHold('${safe(name)}')"
            ontouchstart="startHold('${safe(name)}')"

            onmouseup="cancelHold()"
            onmouseleave="cancelHold()"
            ontouchend="cancelHold()">

            <div class="file-icon">📁</div>
            <div class="file-name">${name}</div>

        </div>
        `;
    });

    /* QUESTIONS */
    questions.forEach((q,index)=>{

        html += `
        <div class="file-item question"
            onclick="openQuestion('${q.id}')">

            <div class="file-icon">📄</div>

            <div class="file-name">
                Q${index+1}. ${q.question}
            </div>

        </div>
        `;
    });

    if(!html){
        html = `
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

/* ================= OPEN FOLDER ================= */
window.openFolder = (name)=>{
    currentPath.push(name);
    renderFiles();
};

/* ================= BACK ================= */
window.goFolderBack = ()=>{
    if(currentPath.length>0){
        currentPath.pop();
        renderFiles();
    }
};

/* ================= HOLD ================= */
window.startHold = (name)=>{

    holdTimer = setTimeout(()=>{
        folderPopup(name);
    },900);
};

window.cancelHold = ()=>{
    clearTimeout(holdTimer);
};

/* ================= FOLDER POPUP ================= */
function folderPopup(name){

    getEl("popupQuestion").innerText =
        "📁 Folder : " + name;

    getEl("popupContent").innerHTML = "";

    getEl("popupContent").innerHTML = `
        <div class="popup-btn-row">

            <button class="save-btn"
            onclick="openFolder('${safe(name)}');closePopup();">
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

        </div>
    `;

    getEl("popup").classList.add("show");
}

/* ================= RENAME POPUP ================= */
window.renameFolder = (oldName)=>{

    getEl("popupQuestion").innerText =
        "✏ Rename Folder";

    getEl("popupContent").innerHTML = `
        <label>Current Name</label>
        <input value="${oldName}" disabled>

        <label>New Name</label>
        <input id="newFolderName"
        placeholder="Enter New Folder Name">

        <br><br>

        <button class="save-btn"
        onclick="saveRenameFolder('${safe(oldName)}')">
        💾 Save Name
        </button>
    `;
};

/* ================= SAVE RENAME ================= */
window.saveRenameFolder = async (oldName)=>{

    const newName =
    getEl("newFolderName").value.trim();

    if(!newName){
        showToast("Enter Folder Name");
        return;
    }

    for(let q of allQuestions){

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ];

        if(levels[currentPath.length]===oldName){

            if(currentPath.length===0) levels[0]=newName;
            if(currentPath.length===1) levels[1]=newName;
            if(currentPath.length===2) levels[2]=newName;

            await updateDoc(
                doc(db,"questionBank",q.id),
                {
                    subject:levels[0],
                    chapter:levels[1],
                    topic:levels[2]
                }
            );
        }
    }

    closePopup();
    showToast("Folder Renamed ✅");
    await loadAllQuestions();
};

/* ================= DELETE FOLDER ================= */
window.deleteFolder = async (name)=>{

    let targetPath = [...currentPath,name];

    if(!confirm("Delete folder and all inside?"))
        return;

    for(let q of allQuestions){

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v!== "");

        let match = true;

        for(let i=0;i<targetPath.length;i++){
            if(levels[i]!==targetPath[i]){
                match=false;
                break;
            }
        }

        if(match){
            await deleteDoc(
                doc(db,"questionBank",q.id)
            );
        }
    }

    closePopup();
    showToast("Folder Deleted ✅");
    await loadAllQuestions();
};

/* ================= OPEN QUESTION ================= */
window.openQuestion = (id)=>{

    selectedQuestion =
        allQuestions.find(q=>q.id===id);

    if(!selectedQuestion) return;

    getEl("popupQuestion").innerText =
        selectedQuestion.question;

    getEl("popupContent").innerHTML = "";

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

        </div>
    `;

    getEl("popup").classList.add("show");
};

/* ================= CLOSE ================= */
window.closePopup = ()=>{
    getEl("popup").classList.remove("show");
};

/* ================= PREVIEW ================= */
window.previewQuestion = ()=>{

    let ans =
    parseInt(selectedQuestion.answer);

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

        html += `<div class="all-box">
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

/* ================= EDIT ================= */
window.editQuestion = ()=>{

    let ans =
    parseInt(selectedQuestion.answer);

    if(isNaN(ans)) ans=0;

    let html=`
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

    <br><br>

    <button class="save-btn"
    onclick="saveEdit()">
    💾 Save Changes
    </button>
    `;

    getEl("popupContent").innerHTML = html;

    getEl("correctAns").value =
    String(ans);
};

/* ================= SAVE EDIT ================= */
window.saveEdit = async ()=>{

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

    closePopup();
    showToast("Updated ✅");
    await loadAllQuestions();
};

/* ================= DELETE QUESTION ================= */
window.deleteQuestion = async ()=>{

    if(!confirm("Delete question?"))
        return;

    await deleteDoc(
        doc(db,"questionBank",selectedQuestion.id)
    );

    closePopup();
    showToast("Question Deleted ✅");

    await loadAllQuestions();
};
