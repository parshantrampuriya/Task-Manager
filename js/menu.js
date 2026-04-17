/* ================= GLOBAL MENU SYSTEM ================= */

/* ================= NAVIGATION ================= */

window.goHome = () => location.href = "home.html";
window.goTasks = () => location.href = "tasks.html";
window.goGoals = () => location.href = "goals.html";
window.goFriends = () => location.href = "friends.html";   // 🔥 NEW
window.goCreateTest = () => location.href = "create-test.html";

window.goGiveTest = () => location.href = "give-test.html";
window.goProfile = () => location.href = "profile.html";

/* ================= SIDEBAR TOGGLE ================= */

window.toggleSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("active");
};

/* ================= CLICK OUTSIDE CLOSE ================= */

document.addEventListener("click", (e) => {

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.querySelector(".menu-btn");

    if (!sidebar || !menuBtn) return;

    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});

/* ================= ACTIVE MENU HIGHLIGHT ================= */

document.addEventListener("DOMContentLoaded", () => {

    const currentPage = window.location.pathname.split("/").pop();

    const buttons = document.querySelectorAll("#sidebar button");

    buttons.forEach(btn => {

        const text = btn.innerText.toLowerCase();

        if (
            (currentPage.includes("home") && text.includes("home")) ||
            (currentPage.includes("tasks") && text.includes("tasks")) ||
            (currentPage.includes("goals") && text.includes("goals")) ||
            (currentPage.includes("friends") && text.includes("friends")) ||
            (currentPage.includes("profile") && text.includes("profile"))
        ) {
            btn.style.background = "linear-gradient(45deg,#00cfff,#00ffcc)";
            btn.style.color = "black";
        }
    });
});
