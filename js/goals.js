let goals = JSON.parse(localStorage.getItem("goals")) || [];

let currentIndex = null;
let currentMode = null;

/* INIT */
window.onload = () => {
    document.getElementById("addBtn").addEventListener("click", addGoal);
    render();
};

/* ADD GOAL */
function addGoal() {

    let name = document.getElementById("goalName").value;
    let total = Number(document.getElementById("goalTotal").value);
    let deadline = document.getElementById("goalDeadline").value;

    if (!name || !total) {
        alert("Enter name & total");
        return;
    }

    goals.push({
        name,
        total,
        done: 0,
        deadline: deadline || null
    });

    document.getElementById("goalName").value = "";
    document.getElementById("goalTotal").value = "";
    document.getElementById("goalDeadline").value = "";

    save();
}

/* RENDER */
function render() {

    let container = document.getElementById("goalContainer");
    if (!container) return;

    let html = "";

    goals.forEach((g, i) => {

        let percent = Math.min((g.done / g.total) * 100, 100);

        html += `
        <div class="goal-card">

            <h3>${g.name}</h3>

            <p>${g.done} / ${g.total}</p>

            ${g.deadline ? `<small>⏳ Deadline: ${g.deadline}</small>` : ""}

            <div class="progress-bar">
                <div class="fill" style="width:${percent}%"></div>
            </div>

            <div class="actions">
                <button onclick="openModal('progress', ${i})">+ Progress</button>
                <button onclick="openModal('edit', ${i})">Edit</button>
                <button onclick="deleteGoal(${i})">Delete</button>
            </div>

        </div>`;
    });

    container.innerHTML = html;
}

/* OPEN MODAL */
function openModal(mode, index) {

    currentIndex = index;
    currentMode = mode;

    document.getElementById("modal").classList.add("active");

    let nameInput = document.getElementById("modalName");
    let totalInput = document.getElementById("modalInput");
    let dateInput = document.getElementById("modalDate");

    if (mode === "progress") {

        document.getElementById("modalTitle").innerText = "Add Progress";

        nameInput.style.display = "none";
        dateInput.style.display = "none";

        totalInput.placeholder = "Enter progress";
        totalInput.value = "";
    }

    if (mode === "edit") {

        let g = goals[index];

        document.getElementById("modalTitle").innerText = "Edit Goal";

        nameInput.style.display = "block";
        dateInput.style.display = "block";

        nameInput.value = g.name;
        totalInput.value = g.total;
        dateInput.value = g.deadline || "";
    }
}

/* CLOSE */
function closeModal() {
    document.getElementById("modal").classList.remove("active");
}

/* SAVE MODAL */
function saveModal() {

    let totalInput = document.getElementById("modalInput").value;

    if (!totalInput) return;

    if (currentMode === "progress") {

        goals[currentIndex].done += Number(totalInput);
    }

    if (currentMode === "edit") {

        let name = document.getElementById("modalName").value;
        let total = Number(document.getElementById("modalInput").value);
        let deadline = document.getElementById("modalDate").value;

        goals[currentIndex].name = name;
        goals[currentIndex].total = total;
        goals[currentIndex].deadline = deadline || null;
    }

    save();
    closeModal();
}

/* DELETE */
function deleteGoal(i) {
    goals.splice(i, 1);
    save();
}

/* SAVE */
function save() {
    localStorage.setItem("goals", JSON.stringify(goals));
    render();
}

/* NAV */
function goHome() {
    window.location.href = "home.html";
}
