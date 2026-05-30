/* ================= FINAL UPDATED menu.js ================= */
/* Friend Mode + Planner Support */

function getViewUser(){

const url =
new URLSearchParams(
location.search
);

return url.get("viewUser");

}

const viewUser =
getViewUser();

/* ================= OPEN PAGE ================= */

function openPage(page){

if(viewUser){

location.href =
page +
"?viewUser=" +
viewUser;

}else{

location.href =
page;

}

}

/* ================= NAVIGATION ================= */

window.goHome =
()=>openPage(
"home.html"
);

window.goTasks =
()=>openPage(
"tasks.html"
);

window.goGoals =
()=>openPage(
"goals.html"
);

window.goPlanner =
()=>openPage(
"planner.html"
);

window.goFriends =
()=>{

location.href =
"friends.html";

};

window.goQuestionBank =
()=>openPage(
"question-bank.html"
);

window.goTests =
()=>openPage(
"tests.html"
);

window.goGrowth =
()=>openPage(
"growth.html"
);

window.goProfile =
()=>openPage(
"profile.html"
);

/* ================= SIDEBAR ================= */

window.toggleSidebar =
()=>{

const sidebar =
document.getElementById(
"sidebar"
);

if(sidebar){

sidebar.classList.toggle(
"active"
);

}

};

/* ================= CLICK OUTSIDE ================= */

document.addEventListener(
"click",
(e)=>{

const sidebar =
document.getElementById(
"sidebar"
);

const menuBtn =
document.querySelector(
".menu-btn"
);

if(
!sidebar ||
!menuBtn
) return;

if(

sidebar.classList.contains(
"active"
)

&&

!sidebar.contains(
e.target
)

&&

!menuBtn.contains(
e.target
)

){

sidebar.classList.remove(
"active"
);

}

}
);

/* ================= LOAD ================= */

document.addEventListener(
"DOMContentLoaded",
()=>{

highlightPage();

setupFriendMode();

}
);

/* ================= ACTIVE PAGE ================= */

function highlightPage(){

const page =
location.pathname
.split("/")
.pop()
.toLowerCase();

document
.querySelectorAll(
"#sidebar button"
)
.forEach(btn=>{

const txt =
btn.innerText
.toLowerCase();

let active =
false;

if(
page.includes("home")
&&
txt.includes("home")
)
active = true;

if(
page.includes("tasks")
&&
txt.includes("tasks")
)
active = true;

if(
page.includes("goals")
&&
txt.includes("goals")
)
active = true;

if(
page.includes("planner")
&&
txt.includes("planner")
)
active = true;

if(
page.includes("friends")
&&
txt.includes("friends")
)
active = true;

if(
page.includes("question")
&&
txt.includes("question")
)
active = true;

if(
page.includes("tests")
&&
txt.includes("tests")
)
active = true;

if(
page.includes("growth")
&&
txt.includes("growth")
)
active = true;

if(
page.includes("profile")
&&
txt.includes("profile")
)
active = true;

if(active){

btn.style.background =
"linear-gradient(45deg,#00cfff,#00ffcc)";

btn.style.color =
"#000";

btn.style.fontWeight =
"700";

}

});

}

/* ================= FRIEND MODE ================= */

function setupFriendMode(){

if(!viewUser)
return;

/* remove top button if exists */

const topBtn =
document.getElementById(
"topReturn"
);

if(topBtn)
topBtn.remove();

/* replace logout */

const logout =
document.getElementById(
"logoutBtn"
);

if(logout){

logout.innerText =
"↩ My Dashboard";

logout.onclick =
()=>{

location.href =
"home.html";

};

logout.style.background =
"linear-gradient(45deg,#00ff99,#00eaff)";

logout.style.color =
"#000";

logout.style.fontWeight =
"700";

}

}

/* ================= LOGOUT NORMAL MODE ================= */

document.addEventListener(
"DOMContentLoaded",
()=>{

if(viewUser)
return;

const logout =
document.getElementById(
"logoutBtn"
);

if(logout){

logout.onclick =
()=>{

localStorage.clear();

sessionStorage.clear();

location.href =
"index.html";

};

}

}
);
