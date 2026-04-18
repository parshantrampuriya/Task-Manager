import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = (id)=>document.getElementById(id);

let currentUser = null;

/* AUTH */
onAuthStateChanged(auth,(user)=>{

    if(!user){
        location.href="index.html";
        return;
    }

    currentUser = user;

    newCode();
    loadMyTests();
});

/* RANDOM CODE */
window.newCode = ()=>{

    let code =
        "T" +
        Math.floor(Math.random()*9000 + 1000);

    getEl("testCode").innerText = code;
};

/* PREVIEW */
let previewOpen = false;

window.previewTest = ()=>{

    let area = getEl("previewArea");

    /* CLOSE IF OPEN */
    if(previewOpen){
        area.innerHTML = "No preview yet";
        previewOpen = false;
        return;
    }

    let raw = getEl("jsonBox").value.trim();

    if(!raw){
        area.innerText="Paste JSON first";
        return;
    }

    try{

        let data = JSON.parse(raw);

        let html = "";

        data.forEach((q,i)=>{

            html += `
            <div style="margin-bottom:15px;">
                <b>Q${i+1}. ${q.question}</b>
            `;

            q.options.forEach((op,index)=>{

                html += `
                <div class="option ${index===q.answer ? 'correct':''}">
                    ${String.fromCharCode(65+index)}. ${op}
                </div>`;
            });

            html += `</div>`;
        });

        area.innerHTML = html;
        previewOpen = true;

    }catch{
        area.innerText="Invalid JSON";
    }
};
/* CREATE */
window.createTest = async ()=>{

    let testName = getEl("testName").value.trim();
    let topic = getEl("testTopic").value.trim();
    let duration = Number(getEl("testDuration").value || 60);
    let code = getEl("testCode").innerText;
    let raw = getEl("jsonBox").value.trim();

    if(!testName || !topic || !raw){
        alert("Fill all fields");
        return;
    }

    let questions = [];

    try{
        questions = JSON.parse(raw);
    }catch{
        alert("Invalid JSON");
        return;
    }

    await addDoc(collection(db,"tests"),{
        createdBy: currentUser.uid,
        testName,
        topic,
        duration,
        code,
        questions,
        createdAt: serverTimestamp()
    });

    alert("Test Created ✅");

    getEl("testName").value="";
    getEl("testTopic").value="";
    getEl("testDuration").value="";
    getEl("jsonBox").value="";
    getEl("previewArea").innerText="No preview yet";

    newCode();
};

/* LOAD MY TESTS */
function loadMyTests(){

    onSnapshot(
        query(
            collection(db,"tests"),
            where("createdBy","==",currentUser.uid)
        ),
        snap=>{

            let html = "";

            snap.forEach(d=>{

                let t = d.data();

                html += `
                <div class="test-item">
                    <b>${t.testName}</b>

                    <div class="small">📘 ${t.topic}</div>
                    <div class="small">🔑 ${t.code}</div>
                    <div class="small">⏱ ${t.duration} min</div>

                    <div class="btn-row">
                        <button onclick="deleteTest('${d.id}')">🗑 Delete</button>
                    </div>
                </div>`;
            });

            getEl("testList").innerHTML =
                html || "No tests created yet";
        }
    );
}

/* DELETE */
window.deleteTest = async(id)=>{

    if(confirm("Delete this test?")){
        await deleteDoc(doc(db,"tests",id));
    }
};