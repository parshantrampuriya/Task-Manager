/* ================= ADD THESE CHANGES IN YOUR view-question.js ================= */

/* Replace only renderFiles() function with this */

function renderFiles(){

    const fileArea = getEl("fileArea");
    const pathText = getEl("pathText");
    const viewBtn = getEl("viewAllBtn");

    pathText.innerText =
        currentPath.length === 0
        ? "Home"
        : currentPath.join(" > ");

    let folders = [];
    let questions = [];

    allQuestions.forEach(q=>{

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v !== "");

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
    questions.sort((a,b)=>
        a.question.localeCompare(b.question)
    );

    /* SHOW / HIDE VIEW ALL BUTTON */
    if(viewBtn){
        viewBtn.style.display =
            questions.length > 0 ? "inline-flex" : "none";
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

        </div>`;
    });

    /* QUESTIONS WITH NUMBER */
    questions.forEach((q,index)=>{

        html += `
        <div class="file-item question"
            onclick="openQuestion('${q.id}')">

            <div class="file-icon">📄</div>

            <div class="file-name">
                Q${index+1}. ${q.question}
            </div>

        </div>`;
    });

    if(!html){
        html = `
        <div class="file-item">
            <div class="file-name">
                Empty Folder
            </div>
        </div>`;
    }

    fileArea.innerHTML = html;
}

/* ================= VIEW ALL QUESTIONS ================= */

window.viewAllQuestions = ()=>{

    let questions = [];

    allQuestions.forEach(q=>{

        const levels = [
            q.subject || "",
            q.chapter || "",
            q.topic || ""
        ].filter(v=>v !== "");

        let match = true;

        for(let i=0;i<currentPath.length;i++){
            if(levels[i] !== currentPath[i]){
                match = false;
                break;
            }
        }

        if(match && levels.length === currentPath.length){
            questions.push(q);
        }
    });

    questions.sort((a,b)=>
        a.question.localeCompare(b.question)
    );

    let html = "";

    questions.forEach((q,no)=>{

        let ans = parseInt(q.answer);
        if(isNaN(ans)) ans = 0;

        html += `
        <div class="all-box">
            <h3>Q${no+1}. ${q.question}</h3>
        `;

        q.options.forEach((op,i)=>{

            html += `
            <div class="option-box ${
                i===ans ? 'correct' : ''
            }">
                ${String.fromCharCode(65+i)}.
                ${op}
                ${i===ans ? ' ✅' : ''}
            </div>`;
        });

        html += `</div>`;
    });

    getEl("popupQuestion").innerText =
        "All Questions Preview";

    getEl("popupContent").innerHTML = html;

    getEl("popup").classList.add("show");
};
