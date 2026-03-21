let goals = JSON.parse(localStorage.getItem("goals")) || [];

/* ADD */
function addGoal() {

    let name = document.getElementById("goalName").value;
    let total = Number(document.getElementById("goalTotal").value);

    if (!name || !total) return;

    goals.push({
        name,
        total,
        done: 0
    });

    save();
}

/* RENDER */
function render() {

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
                <button onclick="updateGoal(${i})">+ Progress</button>
                <button onclick="editGoal(${i})">Edit</button>
                <button onclick="deleteGoal(${i})">Delete</button>
            </div>

        </div>`;
    });

    document.getElementById("goalContainer").innerHTML = html;
}

/* UPDATE */
function updateGoal(i) {

    let val = prompt("Add progress");

    if (!val) return;

    goals[i].done += Number(val);

    save();
}

/* EDIT */
function editGoal(i) {

    let name = prompt("Edit name", goals[i].name);
    let total = prompt("Edit total", goals[i].total);

    if (name) goals[i].name = name;
    if (total) goals[i].total = Number(total);

    save();
}

/* DELETE */
function deleteGoal(i) {
    goals.splice(i,1);
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

/* INIT */
render();
