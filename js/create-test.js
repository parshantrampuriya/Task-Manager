/* ================= CREATE TEST PAGE ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let mode = "bank";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadSubjects();
    await loadFriends();
});

/* ================= MENU ================= */
window.toggleSidebar = ()=>{

    const sidebar = getEl("sidebar");

    if(sidebar){
        sidebar.classList.toggle("active");
    }
};

/* ================= MODE SWITCH ================= */
window.setMode = (type)=>{

    mode = type;

    getEl("bankBtn").classList.remove("active");
    getEl("manualBtn").classList.remove("active");

    if(type === "bank"){

        getEl("bankBtn").classList.add("active");

        getEl("bankArea").style.display = "block";
        getEl("manualArea").style.display = "none";

    }else{

        getEl("manualBtn").classList.add("active");

        getEl("bankArea").style.display = "none";
        getEl("manualArea").style.display = "block";
    }
};

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects(){

    const snap =
    await getDocs(collection(db,"questionBank"));

    let arr = [];

    snap.forEach(doc=>{

        const d = doc.data();

        if(
            d.uid === currentUser.uid &&
            d.subject &&
            !arr.includes(d.subject)
        ){
            arr.push(d.subject);
        }
    });

    arr.sort();

    let html =
    `<option value="">Select Subject</option>`;

    arr.forEach(name=>{

        html += `
        <option value="${name}">
        ${name}
        </option>`;
    });

    getEl("subjectList").innerHTML = html;
}

/* ================= LOAD FRIENDS ================= */
async function loadFriends(){

    const box = getEl("friendList");

    const snap =
    await getDocs(collection(db,"friends"));

    let html = "";

    for(const row of snap.docs){

        const users =
        row.data().users || [];

        if(!users.includes(currentUser.uid))
        continue;

        const friendId =
        users.find(id =>
        id !== currentUser.uid);

        html += `
        <label class="friend-item check-row">

            <input type="checkbox"
            class="friendCheck"
            value="${friendId}">

            Friend User

        </label>`;
    }

    box.innerHTML =
    html || "No Friends Found";
}

/* ================= PREVIEW ================= */
window.previewTest = ()=>{

    const name =
    getEl("testName").value.trim();

    const duration =
    getEl("duration").value || 0;

    const total =
    getEl("totalMarks").value || 0;

    const pass =
    getEl("passMarks").value || 0;

    getEl("previewBox").innerHTML = `
    <b>Test Name:</b> ${name || "Untitled"}<br>
    <b>Duration:</b> ${duration} Minutes<br>
    <b>Total Marks:</b> ${total}<br>
    <b>Passing Marks:</b> ${pass}<br>
    <b>Question Source:</b>
    ${mode === "bank"
    ? "Question Bank"
    : "Manual JSON"}
    `;
};

/* ================= CREATE TEST ================= */
window.createTest = async ()=>{

    const testName =
    getEl("testName").value.trim();

    if(!testName){
        showToast("Enter Test Name");
        return;
    }

    let assignedUsers = [];

    if(getEl("selfCheck").checked){
        assignedUsers.push(currentUser.uid);
    }

    document
    .querySelectorAll(".friendCheck")
    .forEach(box=>{

        if(box.checked){
            assignedUsers.push(box.value);
        }
    });

    if(assignedUsers.length === 0){
        showToast("Select Users");
        return;
    }

    await addDoc(
        collection(db,"tests"),
        {

            ownerId:
            currentUser.uid,

            testName,

            description:
            getEl("testDesc").value.trim(),

            duration:
            Number(
            getEl("duration").value || 0
            ),

            totalMarks:
            Number(
            getEl("totalMarks").value || 0
            ),

            passMarks:
            Number(
            getEl("passMarks").value || 0
            ),

            sourceMode:
            mode,

            subject:
            getEl("subjectList").value,

            questionCount:
            Number(
            getEl("questionCount").value || 0
            ),

            manualJson:
            getEl("jsonBox").value.trim(),

            assignedUsers,

            shuffleQuestions:
            getEl("shuffleQ").checked,

            shuffleOptions:
            getEl("shuffleO").checked,

            instantResult:
            getEl("instantResult").checked,

            releaseLater:
            getEl("releaseLater").checked,

            createdAt:
            Date.now()
        }
    );

    showToast("Test Created ✅");

    setTimeout(()=>{
        location.href =
        "test-dashboard.html";
    },1000);
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
