import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;
let allTests = [];
let activeTab = "available";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadTests();
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
async function loadTests(){

    const snap = await getDocs(
        collection(db,"tests")
    );

    allTests = [];

    snap.forEach(d=>{

        const data = d.data();

        const assigned =
        data.assignedTo || [];

        if(
            assigned.includes(currentUser.uid)
        ){
            allTests.push({
                id:d.id,
                ...data
            });
        }
    });

    renderTests();
}

/* ================= TAB ================= */
window.changeTab = (tab,btn)=>{

    activeTab = tab;

    document
    .querySelectorAll(".tab-btn")
    .forEach(x=>x.classList.remove("active"));

    btn.classList.add("active");

    renderTests();
};

/* ================= STATUS ================= */
function getStatus(test){

    const now = Date.now();

    const start =
    Number(test.startAt || 0);

    const end =
    Number(test.endAt || 0);

    const attemptedUsers =
    test.attemptedUsers || [];

    if(
        attemptedUsers.includes(
            currentUser.uid
        )
    ){
        return "attempted";
    }

    if(start && now < start){
        return "upcoming";
    }

    if(end && now > end){
        return "expired";
    }

    return "available";
}

/* ================= RENDER ================= */
window.renderTests = ()=>{

    let arr = [...allTests];

    arr = arr.filter(x=>
        getStatus(x) === activeTab
    );

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

    if(sort === "name"){
        arr.sort((a,b)=>
            (a.testName || "")
            .localeCompare(
                b.testName || ""
            )
        );
    }

    if(sort === "marks"){
        arr.sort((a,b)=>
            Number(b.totalMarks||0) -
            Number(a.totalMarks||0)
        );
    }

    if(sort === "new"){
        arr.sort((a,b)=>
            Number(b.createdAt||0) -
            Number(a.createdAt||0)
        );
    }

    /* Stats */
    getEl("availableCount").innerText =
        allTests.filter(x=>
            getStatus(x)==="available"
        ).length;

    getEl("attemptedCount").innerText =
        allTests.filter(x=>
            getStatus(x)==="attempted"
        ).length;

    getEl("pendingCount").innerText =
        allTests.filter(x=>
            getStatus(x)==="upcoming"
        ).length;

    /* Cards */
    let html = "";

    arr.forEach(test=>{

        const status =
        getStatus(test);

        html += `
        <div class="test-card">

            <div class="test-top">

                <div>

                    <div class="test-name">
                        ${test.testName || "Untitled"}
                    </div>

                    <div class="by-text">
                        By: ${test.creatorName || "Admin"}
                    </div>

                </div>

                <div class="badge ${status}">
                    ${cap(status)}
                </div>

            </div>

            <div class="meta-grid">

                <div class="meta-box">
                    <h4>Questions</h4>
                    <p>${
                        (test.questions || []).length
                    }</p>
                </div>

                <div class="meta-box">
                    <h4>Marks</h4>
                    <p>${
                        test.totalMarks || 0
                    }</p>
                </div>

                <div class="meta-box">
                    <h4>Time</h4>
                    <p>${
                        test.duration || 0
                    } min</p>
                </div>

                <div class="meta-box">
                    <h4>Negative</h4>
                    <p>${
                        test.negativeMarks || 0
                    }%</p>
                </div>

            </div>

            <div class="action-row">

                <button class="action-btn"
                onclick="viewInfo('${test.id}')">
                👁 Details
                </button>

                ${
                    status==="available"
                    ?
                    `
                    <button
                    class="action-btn primary"
                    onclick="startTest('${test.id}')">
                    🚀 Start Test
                    </button>
                    `
                    :
                    `
                    <button
                    class="action-btn primary"
                    onclick="viewResult('${test.id}')">
                    📊 Result
                    </button>
                    `
                }

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

    getEl("testList").innerHTML =
    html;
};

/* ================= DETAILS ================= */
window.viewInfo = (id)=>{

    const test =
    allTests.find(x=>x.id===id);

    if(!test) return;

    getEl("popupTitle").innerText =
        test.testName;

    getEl("popupBody").innerHTML = `
        <p><b>Description:</b>
        ${test.testDesc || "-"}</p>

        <p><b>Total Marks:</b>
        ${test.totalMarks || 0}</p>

        <p><b>Duration:</b>
        ${test.duration || 0} min</p>

        <p><b>Questions:</b>
        ${(test.questions || []).length}</p>

        <p><b>Negative:</b>
        ${test.negativeMarks || 0}%</p>
    `;

    getEl("infoPopup")
    .classList.add("show");
};

window.closePopup = ()=>{

    getEl("infoPopup")
    .classList.remove("show");
};

/* ================= START TEST ================= */
window.startTest = (id)=>{

    location.href =
    "attempt-test.html?id=" + id;
};

/* ================= RESULT ================= */
window.viewResult = (id)=>{

    location.href =
    "result.html?id=" + id;
};

/* ================= HELPERS ================= */
function cap(txt){

    return txt.charAt(0)
    .toUpperCase()
    + txt.slice(1);
}
