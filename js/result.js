import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    getDocs,
    collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

const params = new URLSearchParams(location.search);
const testId = params.get("id");

let currentUser = null;
let testData = null;
let resultData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    await loadData();
});

/* ================= LOAD ================= */
async function loadData(){

    if(!testId){
        location.href = "give-test.html";
        return;
    }

    /* Test */
    const testSnap = await getDoc(
        doc(db,"tests",testId)
    );

    if(!testSnap.exists()){
        showToast("Test not found");
        return;
    }

    testData = testSnap.data();

    /* Result */
    const resSnap = await getDocs(
        collection(db,"results")
    );

    resSnap.forEach(d=>{

        const x = d.data();

        if(
            x.testId === testId &&
            x.uid === currentUser.uid
        ){
            resultData = x;
        }
    });

    if(!resultData){
        showToast("Result not found");
        return;
    }

    checkReleaseMode();
}

/* ================= RELEASE ================= */
function checkReleaseMode(){

    const mode =
    testData.resultMode || "instant";

    getEl("modeText").innerText =
        mode;

    if(mode === "manual"){
        getEl("lockBox").style.display =
        "block";

        getEl("resultArea").style.display =
        "none";

        return;
    }

    if(
        mode === "enddate" &&
        testData.endAt &&
        Date.now() <
        Number(testData.endAt)
    ){
        getEl("lockBox").style.display =
        "block";

        getEl("resultArea").style.display =
        "none";

        return;
    }

    renderResult();
}

/* ================= RESULT ================= */
function renderResult(){

    const score =
    Number(resultData.score || 0);

    const total =
    Number(resultData.totalMarks || 0);

    const percent =
    total > 0
    ? ((score/total)*100).toFixed(1)
    : 0;

    getEl("scoreText").innerText =
        score + " / " + total;

    getEl("percentText").innerText =
        percent + "%";

    const passMarks =
    Number(testData.passMarks || 0);

    getEl("statusText").innerText =
        score >= passMarks
        ? "✅ Passed"
        : "❌ Failed";

    /* Analysis */
    const qs =
    testData.questions || [];

    const ans =
    resultData.answers || [];

    let correct = 0;
    let wrong = 0;
    let skip = 0;

    qs.forEach((q,i)=>{

        const user =
        ans[i];

        const real =
        Number(q.answer);

        if(user === null ||
           user === undefined){

            skip++;

        }else if(
            Number(user) === real
        ){
            correct++;

        }else{
            wrong++;
        }
    });

    getEl("correctCount").innerText =
        correct;

    getEl("wrongCount").innerText =
        wrong;

    getEl("skipCount").innerText =
        skip;

    const neg =
    Number(testData.negativeMarks||0);

    const perQ =
    qs.length>0
    ? total / qs.length
    : 0;

    const negative =
    (wrong * perQ * (neg/100))
    .toFixed(2);

    getEl("negativeCount").innerText =
        negative;

    const attempted =
    correct + wrong;

    const acc =
    attempted>0
    ? ((correct/attempted)*100)
      .toFixed(1)
    : 0;

    getEl("accuracyText").innerText =
        acc + "%";

    getEl("rankText").innerText =
        "--";

    getEl("submitTime").innerText =
        formatDate(
            resultData.submittedAt
        );
}

/* ================= ANSWERS ================= */
window.viewAnswers = ()=>{

    const qs =
    testData.questions || [];

    const ans =
    resultData.answers || [];

    let html = "";

    qs.forEach((q,no)=>{

        html += `
        <div class="answer-item">

            <h3>
            Q${no+1}. ${q.question}
            </h3>
        `;

        (q.options || [])
        .forEach((op,i)=>{

            let cls = "";

            if(
                Number(q.answer)===i
            ){
                cls = "correct";
            }

            if(
                ans[no]===i &&
                Number(q.answer)!==i
            ){
                cls = "wrong";
            }

            html += `
            <div class="opt-line ${cls}">
                ${String.fromCharCode(65+i)}.
                ${op}
            </div>
            `;
        });

        html += `</div>`;
    });

    getEl("answerList").innerHTML =
        html;

    getEl("answerPopup")
    .classList.add("show");
};

window.closePopup = ()=>{

    getEl("answerPopup")
    .classList.remove("show");
};

/* ================= PDF ================= */
window.downloadPDF = ()=>{

    window.print();
};

/* ================= HELPERS ================= */
function formatDate(ms){

    if(!ms) return "--";

    const d = new Date(ms);

    return d.toLocaleString();
}

function showToast(msg){

    const t = getEl("toast");

    t.innerText = msg;

    t.classList.add("show");

    setTimeout(()=>{
        t.classList.remove("show");
    },1500);
}
