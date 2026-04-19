/* ================= FINAL js/menu.js ================= */

/* ================= NAVIGATION ================= */

window.goHome = () => location.href = "home.html";

window.goTasks = () => location.href = "tasks.html";

window.goGoals = () => location.href = "goals.html";

window.goFriends = () => location.href = "friends.html";

window.goQuestionBank = () =>
location.href = "question-bank.html";

window.goTests = () =>
location.href = "tests.html";

window.goProfile = () =>
location.href = "profile.html";

/* ================= SIDEBAR ================= */

window.toggleSidebar = () => {

const sidebar =
document.getElementById("sidebar");

if(sidebar){
sidebar.classList.toggle("active");
}

};

/* ================= CLICK OUTSIDE CLOSE ================= */

document.addEventListener("click",(e)=>{

const sidebar =
document.getElementById("sidebar");

const menuBtn =
document.querySelector(".menu-btn");

if(!sidebar || !menuBtn) return;

if(
sidebar.classList.contains("active") &&
!sidebar.contains(e.target) &&
!menuBtn.contains(e.target)
){
sidebar.classList.remove("active");
}

});

/* ================= ACTIVE PAGE ================= */

document.addEventListener("DOMContentLoaded",()=>{

const page =
window.location.pathname
.split("/")
.pop()
.toLowerCase();

const buttons =
document.querySelectorAll("#sidebar button");

buttons.forEach(btn=>{

const txt =
btn.innerText.toLowerCase();

let active = false;

if(page.includes("home") &&
txt.includes("home")) active = true;

if(page.includes("tasks") &&
txt.includes("tasks")) active = true;

if(page.includes("goals") &&
txt.includes("goals")) active = true;

if(page.includes("friends") &&
txt.includes("friends")) active = true;

if(
page.includes("question") &&
txt.includes("question")
) active = true;

if(page.includes("tests") &&
txt.includes("tests")) active = true;

if(page.includes("profile") &&
txt.includes("profile")) active = true;

if(active){

btn.style.background =
"linear-gradient(45deg,#00cfff,#00ffcc)";

btn.style.color = "#000";

btn.style.fontWeight = "700";

}

});

});

/* ================= LOGOUT ================= */

document.addEventListener("DOMContentLoaded",()=>{

const logout =
document.getElementById("logoutBtn");

if(logout){

logout.onclick = ()=>{

localStorage.clear();
sessionStorage.clear();

location.href = "index.html";

};

}

});
