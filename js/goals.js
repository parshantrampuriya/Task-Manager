/* LOAD SAVED DATA */
window.onload = () => {
    let goal = JSON.parse(localStorage.getItem("goal"));

    if (goal) {
        show(goal);
    }
};

/* SAVE GOAL */
function saveGoal() {

    let type = document.getElementById("type").value;
    let total = Number(document.getElementById("total").value);
    let deadline = document.getElementById("deadline").value;

    if (!total) return alert("Enter target");

    let goal = {
        type,
        total,
        done: 0,
        deadline
    };

    localStorage.setItem("goal", JSON.stringify(goal));

    show(goal);
}

/* UPDATE PROGRESS */
function updateProgress() {

    let goal = JSON.parse(localStorage.getItem("goal"));

    if (!goal) return alert("Set goal first");

    let done = Number(document.getElementById("done").value);

    goal.done = done;

    localStorage.setItem("goal", JSON.stringify(goal));

    show(goal);
}

/* SHOW DATA */
function show(goal) {

    let percent = Math.min((goal.done / goal.total) * 100, 100);

    document.getElementById("progressFill").style.width = percent + "%";

    document.getElementById("percent").innerText =
        "Progress: " + percent.toFixed(1) + "%";

    document.getElementById("remaining").innerText =
        "Remaining: " + (goal.total - goal.done);

    /* DEADLINE */
    if (goal.deadline) {

        let today = new Date();
        let end = new Date(goal.deadline);

        let days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

        if (days > 0) {
            let daily = Math.ceil((goal.total - goal.done) / days);

            document.getElementById("daily").innerText =
                "Daily Target: " + daily + " per day";
        }
    }

    document.getElementById("result").style.display = "block";
}

/* RESET */
function resetGoal() {
    localStorage.removeItem("goal");
    location.reload();
}

/* NAV */
function goHome() {
    window.location.href = "home.html";
}
