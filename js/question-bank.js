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
onAuthStateChanged(auth, (user) => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    initAll();
});

/* ================= INIT ================= */
async function initAll() {

    fillEmptySelects();

    await loadFolderSelectors();

    changeMode();
}

/* ================= EMPTY SELECTS ================= */
function fillEmptySelects() {

    ["path1","path2","path3","path4","view1","view2","view3","view4"]
    .forEach(id => {
        getEl(id).innerHTML = `<option value="">Select Folder</option>`;
    });
}

/* ================= MODE CHANGE ================= */
window.changeMode = () => {

    let mode =
        document.querySelector('input[name="mode"]:checked').value;

    if(mode === "new"){
        getEl("newFolderBox").style.display = "block";
        getEl("existingFolderBox").style.display = "none";
    }else{
        getEl("newFolderBox").style.display = "none";
        getEl("existingFolderBox").style.display = "block";
    }
};

/* ================= PREVIEW TOGGLE ================= */
window.previewQuestions = () => {

    let box = getEl("previewArea");

    if(previewOpen){
        box.innerHTML = "No Preview Yet";
        previewOpen = false;
        return;
    }

    let raw = getEl("jsonBox").value.trim();

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

    renderQuestions(data, "previewArea");
    previewOpen = true;
};

/* ================= SAVE QUESTIONS ================= */
window.saveQuestions = async () => {

    let raw = getEl("jsonBox").value.trim();

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

    /* VALIDATE */
    for(let q of questions){

        if(
            !q.question ||
            !Array.isArray(q.options) ||
            q.options.length < 2 ||
            q.answer === undefined ||
            isNaN(q.answer)
        ){
            alert("Invalid JSON question format");
            return;
        }
    }

    /* GET FOLDER PATH */
    let path = getFolderPath();

    if(path.length === 0){
        alert("Please select or create folder");
        return;
    }

    for(let q of questions){

        await addDoc(collection(db,"questionBank"),{

            createdBy : currentUser.uid,

            folders : path,

            question : q.question,

            options : q.options,

            answer : Number(q.answer),

            time : Date.now()
        });
    }

    alert("Questions Saved Successfully ✅");

    getEl("jsonBox").value = "";
    getEl("previewArea").innerHTML = "No Preview Yet";
    previewOpen = false;

    await loadFolderSelectors();
};

/* ================= GET FOLDER PATH ================= */
function getFolderPath(){

    let mode =
        document.querySelector('input[name="mode"]:checked').value;

    let path = [];

    if(mode === "new"){

        ["folder1","folder2","folder3","folder4"].forEach(id => {

            let val = getEl(id).value.trim();

            if(val) path.push(val);
        });

    }else{

        ["path1","path2","path3","path4"].forEach(id => {

            let val = getEl(id).value.trim();

            if(val) path.push(val);
        });
    }

    return path;
}

/* ================= LOAD FOLDERS ================= */
async function loadFolderSelectors(){

    fillEmptySelects();

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid)
        )
    );

    let all = [];

    snap.forEach(doc => {
        all.push(doc.data().folders || []);
    });

    /* LEVEL 1 */
    let level1 = [...new Set(all.map(a => a[0]).filter(Boolean))];

    fillSelect("path1", level1);
    fillSelect("view1", level1);
}

/* ================= FILL SELECT ================= */
function fillSelect(id, arr){

    let html = `<option value="">Select Folder</option>`;

    arr.forEach(v => {
        html += `<option value="${v}">${v}</option>`;
    });

    getEl(id).innerHTML = html;
}

/* ================= CASCADE SELECTS ================= */
["path1","path2","path3","view1","view2","view3"].forEach(id => {

    getEl(id).addEventListener("change", async ()=>{

        await handleCascade(id);
    });
});

async function handleCascade(changedId){

    let isView = changedId.startsWith("view");

    let prefix = isView ? "view" : "path";

    let vals = [
        getEl(prefix+"1").value,
        getEl(prefix+"2").value,
        getEl(prefix+"3").value
    ];

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid)
        )
    );

    let all = [];

    snap.forEach(doc => all.push(doc.data().folders || []));

    for(let level=2; level<=4; level++){

        let need =
            vals.slice(0, level-1).filter(Boolean);

        let next = all
            .filter(a =>
                need.every((v,i)=>a[i]===v)
            )
            .map(a => a[level-1])
            .filter(Boolean);

        next = [...new Set(next)];

        fillSelect(prefix+level, next);
    }
}

/* ================= LOAD QUESTIONS ================= */
window.loadQuestions = async ()=>{

    let path = [];

    ["view1","view2","view3","view4"].forEach(id => {

        let v = getEl(id).value.trim();

        if(v) path.push(v);
    });

    if(path.length === 0){
        alert("Select folder");
        return;
    }

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid)
        )
    );

    let data = [];

    snap.forEach(doc => {

        let d = doc.data();

        let folders = d.folders || [];

        let match =
            path.every((v,i)=>folders[i]===v);

        if(match) data.push(d);
    });

    renderQuestions(data,"questionList");
};

/* ================= RENDER ================= */
function renderQuestions(data,target){

    let html = "";

    data.forEach((q,i)=>{

        html += `
        <div class="q-box">

            <b>Q${i+1}. ${q.question}</b>
        `;

        q.options.forEach((op,index)=>{

            html += `
            <div class="option ${index===q.answer ? 'correct':''}">
                ${String.fromCharCode(65+index)}. ${op}
            </div>
            `;
        });

        html += `</div>`;
    });

    getEl(target).innerHTML =
        html || "No Questions Found";
}
