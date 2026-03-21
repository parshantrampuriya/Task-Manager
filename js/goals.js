function calculate() {

    let total = Number(document.getElementById("total").value);
    let done = Number(document.getElementById("done").value);
    let deadline = document.getElementById("deadline").value;

    if (!total || total <= 0) return alert("Enter valid target");

    let percent = Math.min((done / total) * 100, 100);

    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("percent").innerText =
        "Progress: " + percent.toFixed(1) + "%";

    document.getElementById("remaining").innerText =
        "Remaining: " + (total - done);

    /* DAILY CALCULATION */
    if (deadline) {
        let today = new Date();
        let end = new Date(deadline);

        let days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

        if (days > 0) {
            let daily = Math.ceil((total - done) / days);
            document.getElementById("daily").innerText =
                "Daily Target: " + daily;
        }
    }

    document.getElementById("result").style.display = "block";
}

/* NAV */
function goHome() {
    window.location.href = "home.html";
}
