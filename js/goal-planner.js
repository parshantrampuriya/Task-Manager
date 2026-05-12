// CANVAS

const canvas = document.getElementById("canvas");


// ADD NODE BUTTON

const addNodeBtn = document.getElementById("addNodeBtn");


// NODE COUNTER

let nodeCount = 1;


// ADD NEW NODE

addNodeBtn.addEventListener("click", () => {

    nodeCount++;

    const node = document.createElement("div");

    node.classList.add("node", "topic-node");

    node.style.top = `${150 + nodeCount * 40}px`;
    node.style.left = `${150 + nodeCount * 50}px`;

    node.innerHTML = `
        <h3>New Node ${nodeCount}</h3>
        <p>Planning Item</p>
    `;

    canvas.appendChild(node);

    makeDraggable(node);

});


// MAKE EXISTING NODES DRAGGABLE

const allNodes = document.querySelectorAll(".node");

allNodes.forEach(node => {
    makeDraggable(node);
});


// DRAG FUNCTION

function makeDraggable(element){

    let isDragging = false;

    let offsetX = 0;
    let offsetY = 0;

    element.addEventListener("mousedown", (e) => {

        isDragging = true;

        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;

        element.style.zIndex = 1000;

    });

    document.addEventListener("mousemove", (e) => {

        if(!isDragging) return;

        element.style.left = `${e.clientX - offsetX}px`;
        element.style.top = `${e.clientY - offsetY}px`;

    });

    document.addEventListener("mouseup", () => {

        isDragging = false;

        element.style.zIndex = 1;

    });

}


// PROJECT CARD CLICK

const projectCards = document.querySelectorAll(".project-card");

projectCards.forEach(card => {

    card.addEventListener("click", () => {

        alert("Opening Project Workspace...");

    });

});


// NODE CLICK

document.addEventListener("click", (e) => {

    if(e.target.closest(".node")){

        const clickedNode = e.target.closest(".node");

        console.log("Node Selected");

        clickedNode.style.boxShadow =
            "0 0 25px rgba(96,165,250,0.8)";

        setTimeout(() => {

            clickedNode.style.boxShadow =
                "0 10px 30px rgba(0,0,0,0.25)";

        }, 800);

    }

});


// NEW PROJECT BUTTON

const newProjectBtn =
    document.getElementById("newProjectBtn");

newProjectBtn.addEventListener("click", () => {

    const projectName =
        prompt("Enter Project Name");

    if(projectName){

        createProjectCard(projectName);

    }

});


// CREATE PROJECT CARD

function createProjectCard(name){

    const projectSection =
        document.querySelector(".projects-section");

    const card = document.createElement("div");

    card.classList.add("project-card");

    card.innerHTML = `
        <h3>${name}</h3>
        <p>New Planning Workspace</p>

        <div class="progress-bar">
            <div class="progress-fill"
                 style="width:0%">
            </div>
        </div>

        <span>0% Complete</span>
    `;

    projectSection.appendChild(card);

}


// OPTIONAL DOUBLE CLICK TO EDIT

document.addEventListener("dblclick", (e) => {

    const node = e.target.closest(".node");

    if(node){

        const title =
            node.querySelector("h3");

        const newName =
            prompt("Edit Node Name", title.innerText);

        if(newName){

            title.innerText = newName;

        }

    }

});


// ZOOM EFFECT USING CTRL + MOUSEWHEEL

let scale = 1;

canvas.addEventListener("wheel", (e) => {

    if(e.ctrlKey){

        e.preventDefault();

        if(e.deltaY < 0){

            scale += 0.1;

        }else{

            scale -= 0.1;

        }

        scale = Math.min(Math.max(0.5, scale), 2);

        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = "center";

    }

}, { passive:false });


// SAVE STRUCTURE PLACEHOLDER

function saveWorkspace(){

    console.log("Workspace Saved");

}


// AUTO SAVE EVERY 30 SECONDS

setInterval(() => {

    saveWorkspace();

}, 30000);
