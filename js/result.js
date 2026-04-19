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

    const testSnap =
    await getDoc(doc(db,"tests",testId));

    if(!testSnap.exists()){
        showToast("Test not found");
        return;
    }

    testData = testSnap.data();

    const resSnap =
    await getDocs(collection(db,"results"));

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

    getEl("modeText").innerText = mode;

    if(mode==="manual"){

        getEl("lockBox").style.display="block";
        getEl("resultArea").style.display="none";
        return;
    }

    if(
        mode==="enddate" &&
        testData.endAt &&
        Date.now() < Number(testData.endAt)
    ){
        getEl("lockBox").style.display="block";
        getEl("resultArea").style.display="none";
        return;
    }

    renderResult();
}

/* ================= RESULT ================= */
function renderResult(){

    const data = getAnalysis();

    getEl("scoreText").innerText =
        data.score + " / " + data.total;

    getEl("percentText").innerText =
        data.percent + "%";

    getEl("statusText").innerText =
        data.score >= data.passMarks
        ? "✅ Passed"
        : "❌ Failed";

    getEl("correctCount").innerText =
        data.correct;

    getEl("wrongCount").innerText =
        data.wrong;

    getEl("skipCount").innerText =
        data.skip;

    getEl("negativeCount").innerText =
        data.negative;

    getEl("accuracyText").innerText =
        data.accuracy + "%";

    getEl("rankText").innerText = "--";

    getEl("submitTime").innerText =
        formatDate(resultData.submittedAt);
}

/* ================= ANALYSIS ================= */
function getAnalysis(){

    const qs =
    testData.questions || [];

    const ans =
    resultData.answers || [];

    const score =
    Number(resultData.score || 0);

    const total =
    Number(resultData.totalMarks || 0);

    const passMarks =
    Number(testData.passMarks || 0);

    const neg =
    Number(testData.negativeMarks || 0);

    const perQ =
    qs.length>0 ? total/qs.length : 0;

    let correct=0;
    let wrong=0;
    let skip=0;

    qs.forEach((q,i)=>{

        const user = ans[i];

        if(user===null ||
           user===undefined){

            skip++;

        }else if(
            Number(user)===Number(q.answer)
        ){
            correct++;
        }else{
            wrong++;
        }
    });

    const negative =
    (wrong * perQ * (neg/100))
    .toFixed(2);

    const attempted =
    correct + wrong;

    const accuracy =
    attempted>0
    ? ((correct/attempted)*100)
      .toFixed(1)
    : 0;

    const percent =
    total>0
    ? ((score/total)*100)
      .toFixed(1)
    : 0;

    return {
        qs,
        ans,
        score,
        total,
        passMarks,
        correct,
        wrong,
        skip,
        negative,
        accuracy,
        percent
    };
}

/* ================= VIEW ANSWERS ================= */
window.viewAnswers = ()=>{

    const data = getAnalysis();

    let html = "";

    data.qs.forEach((q,no)=>{

        html += `
        <div class="answer-item">
        <h3>Q${no+1}. ${q.question}</h3>
        `;

        q.options.forEach((op,i)=>{

            let cls="";

            if(Number(q.answer)===i){
                cls="correct";
            }

            if(
                data.ans[no]===i &&
                Number(q.answer)!==i
            ){
                cls="wrong";
            }

            html += `
            <div class="opt-line ${cls}">
            ${String.fromCharCode(65+i)}.
            ${op}
            </div>`;
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

/* ================= REAL PDF / REPORT ================= */
window.downloadPDF = ()=>{

    const data = getAnalysis();

    let report = `
<html>
<head>
<title>Result Report</title>
<style>
body{
font-family:Arial;
padding:30px;
line-height:1.6;
}
h1,h2{
margin-bottom:8px;
}
table{
width:100%;
border-collapse:collapse;
margin-top:10px;
}
td,th{
border:1px solid #000;
padding:8px;
text-align:left;
}
.qbox{
margin-top:25px;
padding:15px;
border:1px solid #999;
}
.correct{color:green;font-weight:bold;}
.wrong{color:red;font-weight:bold;}
</style>
</head>
<body>

<h1>Test Result Report</h1>
<h2>${testData.testName || ""}</h2>

<p><b>Name:</b> ${
currentUser.displayName ||
currentUser.email
}</p>

<p><b>Score:</b> ${data.score}/${data.total}</p>
<p><b>Percentage:</b> ${data.percent}%</p>
<p><b>Correct:</b> ${data.correct}</p>
<p><b>Wrong:</b> ${data.wrong}</p>
<p><b>Skipped:</b> ${data.skip}</p>
<p><b>Negative:</b> ${data.negative}</p>
<p><b>Accuracy:</b> ${data.accuracy}%</p>
<p><b>Submitted:</b> ${
formatDate(resultData.submittedAt)
}</p>

<hr>
<h2>Question Review</h2>
`;

    data.qs.forEach((q,no)=>{

        report += `
        <div class="qbox">
        <b>Q${no+1}. ${q.question}</b><br><br>
        `;

        q.options.forEach((op,i)=>{

            let txt = "";

            if(Number(q.answer)===i){
                txt +=
                ` <span class="correct">(Correct)</span>`;
            }

            if(
                data.ans[no]===i &&
                Number(q.answer)!==i
            ){
                txt +=
                ` <span class="wrong">(Your Marked)</span>`;
            }

            report += `
            ${String.fromCharCode(65+i)}.
            ${op}
            ${txt}<br>
            `;
        });

        report += `</div>`;
    });

    report += `
</body>
</html>`;

    const w =
    window.open("","_blank");

    w.document.write(report);
    w.document.close();
    w.print();
};

/* ================= HELPERS ================= */
function formatDate(ms){

    if(!ms) return "--";

    return new Date(ms)
    .toLocaleString();
}

function showToast(msg){

    const t = getEl("toast");

    t.innerText = msg;

    t.classList.add("show");

    setTimeout(()=>{
        t.classList.remove("show");
    },1500);
}
