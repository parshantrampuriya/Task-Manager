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

    if (!name || !total) {
        alert("Enter all fields");
        return;
    }

    goals.push({
        name,
        total,
        done: 0
    });

    document.getElementById("goalName").value = "";
    document.getElementById("goalTotal").value = "";

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

    let input = document.getElementById("modalInput");

    if (mode === "progress") {
        document.getElementById("modalTitle").innerText = "Add Progress";
        input.placeholder = "Enter progress";
        input.value = "";
    }

    if (mode === "edit") {
        document.getElementById("modalTitle").innerText = "Edit Total";
        input.placeholder = "Enter new total";
        input.value = goals[index].total;
    }
}

/* CLOSE MODAL */
function closeModal() {
    document.getElementById("modal").classList.remove("active");
    document.getElementById("modalInput").value = "";
}

/* SAVE MODAL */
function saveModal() {

    let val = Number(document.getElementById("modalInput").value);

    if (!val) return;

    if (currentMode === "progress") {
        goals[currentIndex].done += val;
    }

    if (currentMode === "edit") {
        goals[currentIndex].total = val;
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
