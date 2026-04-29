/* ================= FINAL UPDATED menu.js ================= */
/* Smart Friend View Navigation + Better Sidebar */

function getViewUser(){

const url =
new URLSearchParams(location.search);

return url.get("viewUser");

}

const viewUser = getViewUser();

/* ================= OPEN PAGE ================= */

function openPage(page){

if(viewUser){

location.href =
page + "?viewUser=" + viewUser;

}else{

location.href = page;

}

}

/* ================= NAVIGATION ================= */

window.goHome = ()=>openPage("home.html");

window.goTasks = ()=>{

if(viewUser){
showToast("🔒 Tasks private in friend mode");
return;
}

openPage("tasks.html");

};

window.goGoals = ()=>openPage("goals.html");

window.goFriends = ()=>location.href="friends.html";

window.goQuestionBank = ()=>{

if(viewUser){
showToast("🔒 Not available");
return;
}

openPage("question-bank.html");

};

window.goTests = ()=>{

if(viewUser){
showToast("🔒 Not available");
return;
}

openPage("tests.html");

};

window.goGrowth = ()=>openPage("growth.html");

window.goProfile = ()=>openPage("profile.html");

/* ================= SIDEBAR ================= */

window.toggleSidebar = ()=>{

const sidebar =
document.getElementById("sidebar");

if(sidebar){
sidebar.classList.toggle("active");
}

};

/* ================= CLICK OUTSIDE ================= */

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

/* ================= LOAD ================= */

document.addEventListener("DOMContentLoaded",()=>{

highlightPage();
buildReturnButton();
setupFriendModeSidebar();

});

/* ================= ACTIVE BUTTON ================= */

function highlightPage(){

const page =
location.pathname
.split("/")
.pop()
.toLowerCase();

document
.querySelectorAll("#sidebar button")
.forEach(btn=>{

const txt =
btn.innerText.toLowerCase();

let active = false;

if(page.includes("home") && txt.includes("home")) active=true;
if(page.includes("tasks") && txt.includes("tasks")) active=true;
if(page.includes("goals") && txt.includes("goals")) active=true;
if(page.includes("friends") && txt.includes("friends")) active=true;
if(page.includes("question") && txt.includes("question")) active=true;
if(page.includes("tests") && txt.includes("tests")) active=true;
if(page.includes("growth") && txt.includes("growth")) active=true;
if(page.includes("profile") && txt.includes("profile")) active=true;

if(active){

btn.style.background =
"linear-gradient(45deg,#00cfff,#00ffcc)";

btn.style.color = "#000";
btn.style.fontWeight = "700";

}

});

}

/* ================= FRIEND MODE SIDEBAR ================= */

function setupFriendModeSidebar(){

if(!viewUser) return;

const buttons =
document.querySelectorAll("#sidebar button");

buttons.forEach(btn=>{

const txt =
btn.innerText.toLowerCase();

/* hide private pages in friend mode */
if(
txt.includes("tasks") ||
txt.includes("question") ||
txt.includes("tests") ||
txt.includes("friends")
){
btn.style.display="none";
}

/* rename pages */
if(txt.includes("home")){
btn.innerText="🏠 Friend Home";
}

if(txt.includes("goals")){
btn.innerText="🎯 Friend Goals";
}

if(txt.includes("growth")){
btn.innerText="🌱 Friend Growth";
}

if(txt.includes("profile")){
btn.innerText="👤 Friend Profile";
}

});

/* add dashboard return button */
const side =
document.getElementById("sidebar");

if(side && !document.getElementById("backOwn")){

const btn =
document.createElement("button");

btn.id="backOwn";
btn.innerText="↩ My Dashboard";

btn.style.background =
"linear-gradient(45deg,#00ff99,#00eaff)";

btn.style.color="#000";
btn.style.fontWeight="700";

btn.onclick=()=>{
location.href="home.html";
};

side.appendChild(btn);

}

}

/* ================= NAVBAR RETURN BUTTON ================= */

function buildReturnButton(){

if(!viewUser) return;

const nav =
document.querySelector(".navbar");

if(!nav) return;

if(document.getElementById("topReturn")) return;

const btn =
document.createElement("button");

btn.id="topReturn";
btn.innerText="↩ My Account";
btn.className="top-btn";

btn.onclick=()=>{
location.href="home.html";
};

nav.appendChild(btn);

}

/* ================= TOAST ================= */

function showToast(msg){

let old =
document.getElementById("menuToast");

if(old) old.remove();

const t =
document.createElement("div");

t.id="menuToast";
t.innerText=msg;

t.style.position="fixed";
t.style.bottom="25px";
t.style.left="50%";
t.style.transform="translateX(-50%)";
t.style.padding="12px 18px";
t.style.borderRadius="14px";
t.style.background="#111";
t.style.color="#fff";
t.style.zIndex="9999";
t.style.boxShadow="0 0 20px rgba(0,255,255,.25)";

document.body.appendChild(t);

setTimeout(()=>{
t.remove();
},1800);

}

/* ================= LOGOUT ================= */

document.addEventListener("DOMContentLoaded",()=>{

const logout =
document.getElementById("logoutBtn");

if(logout){

logout.onclick=()=>{

localStorage.clear();
sessionStorage.clear();

location.href="index.html";

};

}

});
