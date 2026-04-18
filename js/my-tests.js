import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allTests = [];
let activeTab = "all";

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

/* ================= CHANGE TAB ================= */
window.changeTab = (tab,btn)=>{

    activeTab = tab;

    document
    .querySelectorAll(".tab-btn")
    .forEach(x=>x.classList.remove("active"));

    btn.classList.add("active");

    renderTests();
};

/* ================= SEARCH ================= */
window.searchTests = ()=>{
    renderTests();
};

/* ================= RENDER ================= */
function renderTests(){

    let arr = [...allTests];

    /* Filter by tab */
    if(activeTab !== "all"){
        arr = arr.filter(x=>
            (x.status || "active") === activeTab
        );
    }

    /* Search */
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

    /* Sort */
    const sort =
    getEl("sortBox").value;

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

    /* Stats */
    getEl("totalTests").innerText =
        allTests.length;

    getEl("activeTests").innerText =
        allTests.filter(x=>
            (x.status || "active") === "active"
        ).length;

    let attempts = 0;

    allTests.forEach(x=>{
        attempts += Number(
            x.attemptCount || 0
        );
    });

    getEl("attemptCount").innerText =
        attempts;

    /* HTML */
    let html = "";

    arr.forEach(test=>{

        const status =
        test.status || "active";

        const assigned =
        (test.assignedTo || []).length;

        html += `
        <div class="test-card">

            <div class="test-top">

                <div>
                    <div class="test-name">
                        ${test.testName || "Untitled Test"}
                    </div>
                </div>

                <div class="status ${status}">
                    ${capitalize(status)}
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
                    <h4>Duration</h4>
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
                onclick="deleteTest('${test.id}')">
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
        </div>
        `;
    }

    getEl("testList").innerHTML = html;
}

/* ================= BUTTON ACTIONS ================= */
window.editTest = (id)=>{
    location.href =
    "create-test.html?edit=" + id;
};

window.openResults = (id)=>{
    location.href =
    "admin-results.html?id=" + id;
};

window.assignTest = (id)=>{
    location.href =
    "assign-test.html?id=" + id;
};

window.duplicateTest = (id)=>{
    location.href =
    "create-test.html?copy=" + id;
};

window.deleteTest = async(id)=>{

    if(!confirm("Delete this test?"))
        return;

    await deleteDoc(
        doc(db,"tests",id)
    );

    showToast("Deleted ✅");

    await loadMyTests();
};

/* ================= HELPER ================= */
function capitalize(txt){
    return txt.charAt(0).toUpperCase()
    + txt.slice(1);
}
