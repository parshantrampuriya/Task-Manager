/* ================= GLOBAL MENU SYSTEM ================= */

/* NAVIGATION */
window.goHome = () => location.href = "home.html";
window.goTasks = () => location.href = "tasks.html";
window.goGoals = () => location.href = "goals.html";
window.goProfile = () => location.href = "profile.html";

/* SIDEBAR TOGGLE */
window.toggleSidebar = () => {
    let sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("active");
};

/* CLICK OUTSIDE TO CLOSE */
document.addEventListener("click", (e) => {

    let sidebar = document.getElementById("sidebar");
    let menuBtn = document.querySelector(".menu-btn");

    if (!sidebar || !menuBtn) return;

    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});
