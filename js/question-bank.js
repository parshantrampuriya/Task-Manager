import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where
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

    loadFilters();
});

/* PREVIEW */
window.previewQuestions = ()=>{

    let raw = getEl("jsonBox").value.trim();

    if(!raw){
        getEl("previewArea").innerText="Paste JSON first";
        return;
    }

    try{

        let data = JSON.parse(raw);
        renderQuestions(data,"previewArea");

    }catch{
        getEl("previewArea").innerText="Invalid JSON";
    }
};

/* SAVE */
window.saveQuestions = async ()=>{

    let subject = getEl("subject").value.trim();
    let chapter = getEl("chapter").value.trim();
    let topic = getEl("topic").value.trim();
    let raw = getEl("jsonBox").value.trim();

    if(!subject || !chapter || !topic || !raw){
        alert("Fill all fields");
        return;
    }

    let data=[];

    try{
        data = JSON.parse(raw);
    }catch{
        alert("Invalid JSON");
        return;
    }

    for(let q of data){

        await addDoc(collection(db,"questionBank"),{
            createdBy: currentUser.uid,
            subject,
            chapter,
            topic,
            question:q.question,
            options:q.options,
            answer:q.answer
        });
    }

    alert("Questions Saved ✅");

    getEl("subject").value="";
    getEl("chapter").value="";
    getEl("topic").value="";
    getEl("jsonBox").value="";
    getEl("previewArea").innerText="No preview yet";

    loadFilters();
};

/* LOAD FILTERS */
async function loadFilters(){

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid)
        )
    );

    let subjects = new Set();

    snap.forEach(d=>{
        subjects.add(d.data().subject);
    });

    let html = `<option value="">Select Subject</option>`;

    subjects.forEach(s=>{
        html += `<option>${s}</option>`;
    });

    getEl("filterSubject").innerHTML = html;

    getEl("filterChapter").innerHTML =
        `<option value="">Select Chapter</option>`;

    getEl("filterTopic").innerHTML =
        `<option value="">Select Topic</option>`;
}

/* SUBJECT CHANGE */
getEl("filterSubject").addEventListener("change", async ()=>{

    let subject = getEl("filterSubject").value;

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid),
            where("subject","==",subject)
        )
    );

    let set = new Set();

    snap.forEach(d=>set.add(d.data().chapter));

    let html = `<option value="">Select Chapter</option>`;

    set.forEach(v=>{
        html += `<option>${v}</option>`;
    });

    getEl("filterChapter").innerHTML = html;
});

/* CHAPTER CHANGE */
getEl("filterChapter").addEventListener("change", async ()=>{

    let subject = getEl("filterSubject").value;
    let chapter = getEl("filterChapter").value;

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid),
            where("subject","==",subject),
            where("chapter","==",chapter)
        )
    );

    let set = new Set();

    snap.forEach(d=>set.add(d.data().topic));

    let html = `<option value="">Select Topic</option>`;

    set.forEach(v=>{
        html += `<option>${v}</option>`;
    });

    getEl("filterTopic").innerHTML = html;
});

/* LOAD QUESTIONS */
window.loadQuestions = async ()=>{

    let subject = getEl("filterSubject").value;
    let chapter = getEl("filterChapter").value;
    let topic = getEl("filterTopic").value;

    let snap = await getDocs(
        query(
            collection(db,"questionBank"),
            where("createdBy","==",currentUser.uid),
            where("subject","==",subject),
            where("chapter","==",chapter),
            where("topic","==",topic)
        )
    );

    let data=[];

    snap.forEach(d=>data.push(d.data()));

    renderQuestions(data,"questionList");
};

/* RENDER */
function renderQuestions(data,target){

    let html="";

    data.forEach((q,i)=>{

        html += `
        <div class="q-box">
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

    getEl(target).innerHTML =
        html || "No questions found";
}
