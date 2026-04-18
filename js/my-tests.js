import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allTests = [];
let activeTab = "all";

let editingTest = null;
let deletingId = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadMyTests();
});

/* ================= SIDEBAR ================= */
window.toggleSidebar = ()=>{

    const sidebar = getEl("sidebar");

    if(sidebar){
        sidebar.classList.toggle("active");
    }
};

/* ================= TOAST ================= */
function showToast(msg){

    const t = getEl("toast");

    t.innerText = msg;
    t.classList.add("show");

    setTimeout(()=>{
        t.classList.remove("show");
    },1800);
}

/* ================= LOAD TESTS ================= */
window.loadMyTests = async ()=>{

    const snap = await getDocs(
        query(
            collection(db,"tests"),
            where("createdBy","==",currentUser.uid)
        )
    );

    allTests = [];

    snap.forEach(d=>{
        allTests.push({
            id:d.id,
            ...d.data()
        });
    });

    renderTests();
};

/* ================= TAB ================= */
window.changeTab = (tab,btn)=>{

    activeTab = tab;

    document.querySelectorAll(".tab-btn")
    .forEach(x=>x.classList.remove("active"));

    btn.classList.add("active");

    renderTests();
};

window.searchTests = ()=>{
    renderTests();
};

/* ================= RENDER ================= */
function renderTests(){

    let arr = [...allTests];

    if(activeTab !== "all"){
        arr = arr.filter(x=>
            (x.status || "active") === activeTab
        );
    }

    const txt =
    getEl("searchBox").value
    .trim()
    .toLowerCase();

    if(txt){
        arr = arr.filter(x=>
            (x.testName || "")
            .toLowerCase()
            .includes(txt)
        );
    }

    const sort = getEl("sortBox").value;

    if(sort === "new"){
        arr.sort((a,b)=>
            (b.createdAt||0) -
            (a.createdAt||0)
        );
    }

    if(sort === "old"){
        arr.sort((a,b)=>
            (a.createdAt||0) -
            (b.createdAt||0)
        );
    }

    if(sort === "name"){
        arr.sort((a,b)=>
            (a.testName||"")
            .localeCompare(b.testName||"")
        );
    }

    /* stats */
    getEl("totalTests").innerText =
        allTests.length;

    getEl("activeTests").innerText =
        allTests.filter(x=>
            (x.status || "active")==="active"
        ).length;

    let attempts = 0;

    allTests.forEach(x=>{
        attempts += Number(x.attemptCount||0);
    });

    getEl("attemptCount").innerText =
        attempts;

    /* cards */
    let html = "";

    arr.forEach(test=>{

        const status =
        test.status || "active";

        const assigned =
        (test.assignedTo || []).length;

        html += `
        <div class="test-card">

            <div class="test-top">

                <div class="test-name">
                    ${test.testName || "Untitled Test"}
                </div>

                <div class="status ${status}">
                    ${cap(status)}
                </div>

            </div>

            <div class="meta-grid">

                <div class="meta-box">
                    <h4>Users</h4>
                    <p>${assigned}</p>
                </div>

                <div class="meta-box">
                    <h4>Attempts</h4>
                    <p>${test.attemptCount || 0}</p>
                </div>

                <div class="meta-box">
                    <h4>Marks</h4>
                    <p>${test.totalMarks || 0}</p>
                </div>

                <div class="meta-box">
                    <h4>Time</h4>
                    <p>${test.duration || 0} min</p>
                </div>

            </div>

            <div class="action-row">

                <button class="action-btn primary"
                onclick="editTest('${test.id}')">
                ✏ Edit
                </button>

                <button class="action-btn"
                onclick="openResults('${test.id}')">
                📊 Results
                </button>

                <button class="action-btn"
                onclick="duplicateTest('${test.id}')">
                📄 Duplicate
                </button>

                <button class="action-btn"
                onclick="assignTest('${test.id}')">
                👥 Assign
                </button>

                <button class="action-btn delete"
                onclick="askDelete('${test.id}')">
                🗑 Delete
                </button>

            </div>

        </div>
        `;
    });

    if(!html){
        html = `
        <div class="empty-box">
            No tests found.
        </div>`;
    }

    getEl("testList").innerHTML = html;
}

/* ================= EDIT TEST ================= */
window.editTest = async(id)=>{

    const ref = doc(db,"tests",id);
    const snap = await getDoc(ref);

    if(!snap.exists()) return;

    editingTest = {
        id,
        ...snap.data()
    };

    let questions =
    editingTest.questions || [];

    let qHtml = "";

    questions.forEach((q,i)=>{

        qHtml += `
        <div class="q-item">

            <div class="q-item-top">

                <div>
                    Q${i+1}. ${q.question || ""}
                </div>

                <button class="remove-q"
                onclick="removeQuestion(${i})">
                Remove
                </button>

            </div>

        </div>
        `;
    });

    getEl("editArea").innerHTML = `
        <label>Test Name</label>
        <input id="eName"
        value="${editingTest.testName || ""}">

        <label>Duration (Min)</label>
        <input id="eTime"
        type="number"
        value="${editingTest.duration || 0}">

        <label>Total Marks</label>
        <input id="eMarks"
        type="number"
        value="${editingTest.totalMarks || 0}">

        <label>Negative Marking (%)</label>
        <input id="eNegative"
        type="number"
        value="${editingTest.negativeMarks || 0}">

        <div class="q-list">
            <h3>Questions</h3>
            ${qHtml || "No Questions"}
        </div>

        <div class="popup-btn-row">

            <button class="cancel-btn"
            onclick="closeEditPopup()">
            Cancel
            </button>

            <button class="save-btn"
            onclick="saveEditTest()">
            Save
            </button>

        </div>
    `;

    getEl("editPopup")
    .classList.add("show");
};

/* ================= REMOVE QUESTION ================= */
window.removeQuestion = (index)=>{

    editingTest.questions.splice(index,1);

    editTest(editingTest.id);
};

/* ================= SAVE EDIT ================= */
window.saveEditTest = async()=>{

    await updateDoc(
        doc(db,"tests",editingTest.id),
        {
            testName:
            getEl("eName").value.trim(),

            duration:
            Number(getEl("eTime").value),

            totalMarks:
            Number(getEl("eMarks").value),

            negativeMarks:
            Number(getEl("eNegative").value),

            questions:
            editingTest.questions || []
        }
    );

    closeEditPopup();

    showToast("Updated ✅");

    await loadMyTests();
};

/* ================= DELETE ================= */
window.askDelete = (id)=>{

    deletingId = id;

    getEl("deletePopup")
    .classList.add("show");
};

window.closeDeletePopup = ()=>{

    getEl("deletePopup")
    .classList.remove("show");
};

getEl("confirmDeleteBtn")
.onclick = async()=>{

    if(!deletingId) return;

    await deleteDoc(
        doc(db,"tests",deletingId)
    );

    deletingId = null;

    closeDeletePopup();

    showToast("Deleted ✅");

    await loadMyTests();
};

/* ================= CLOSE EDIT ================= */
window.closeEditPopup = ()=>{

    getEl("editPopup")
    .classList.remove("show");
};

/* ================= OTHER BUTTONS ================= */
window.openResults = (id)=>{
    location.href =
    "admin-results.html?id="+id;
};

window.assignTest = (id)=>{
    location.href =
    "assign-test.html?id="+id;
};

window.duplicateTest = (id)=>{
    location.href =
    "create-test.html?copy="+id;
};

/* ================= HELPERS ================= */
function cap(t){
    return t.charAt(0).toUpperCase()
    + t.slice(1);
}
